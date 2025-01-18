import { $ } from "bun";
import { TunnelManager } from "./interfaces/TunnelManager";
import fs from 'fs';
import path from "path";
import { z } from "zod";
import { Logger } from '../utils/logger/logger';
import { ConsoleLogger } from '../utils/logger/console-logger';
import { getErrorMessage } from "../utils/error";

export interface TunnelNgrokManagerOptions {
	ngrokPort: number;
	forwardPort: number;
	logPath: string;
	healthCheckUrl: string;
	/**
	 * Interval in milliseconds to check if the tunnel is ready.
	 * @default 1000 ms
	 */
	healthCheckInterval: number;
	preStart?: (tunnelUrl: string) => void;
	logger: Logger;
}

export class TunnelNgrokManager implements TunnelManager {
	public options: TunnelNgrokManagerOptions;
	private logger: Logger;
	static resourceInfoSchema = z.object({
		tunnels: z.array(
			z.object({
				public_url: z.string(),
			})
		),
	});

	public static readonly defaultOptions: TunnelNgrokManagerOptions = {
		forwardPort: 7071,
		ngrokPort: 4040,
		logPath: './.logs/ngrok.log',
		healthCheckUrl: 'http://localhost:7071/',
		healthCheckInterval: 1000,
		logger: new ConsoleLogger(),
	};

	constructor(options?: Partial<TunnelNgrokManagerOptions>) {
		this.options = Object.assign({}, TunnelNgrokManager.defaultOptions, options);
		this.logger = this.options.logger;
		this.logger.debug(`TunnelNgrokManager created with options: ${JSON.stringify(this.options)}`);
	}

	async start(): Promise<void> {
		try {
			this.logger.info('Starting tunnel');
			await this.killProcess();

			if (!fs.existsSync(path.dirname(this.options.logPath))) {
				fs.mkdirSync(path.dirname(this.options.logPath), { recursive: true });
			}
			// Show backend status
			this.waitUntilUrlReady(this.options.healthCheckUrl, 'Backend');
			// Run preStart function
			this.preStart();
			// Setup signal handlers
			this.setupNgrokSignalHandlers();
			// Start ngrok tunnel
			await $`ngrok http ${this.options.forwardPort} --log=stdout > ${this.options.logPath}`
		}
		catch (error) {
			throw new Error(`Error starting ngrok tunnel: ${error}`);
		}
	}

	setupNgrokSignalHandlers() {
		const isWindows = process.platform === "win32";
		if (isWindows) {
			this.logger.error("This script is not supported on Windows.");
			return;
		}
		this.setupSignalHandlers();
	}

	private async findNgrokProcessId(disableFindFromPort = false): Promise<string | undefined> {
		try {
			const processName = 'ngrok';
			const ngrokProcessId = (await $`ps aux | grep ${processName} | grep -v grep | awk '{print $2}'`).stdout.toString().trim();
			if (ngrokProcessId) {
				return ngrokProcessId;
			}
			if (disableFindFromPort) {
				return undefined;
			}
			// Try to find the process id from port using lsof
			const ngrokProcessIdFromPort = await $`lsof -t -i :${this.options.ngrokPort}`;
			if (ngrokProcessIdFromPort) {
				return ngrokProcessIdFromPort.stdout.toString().trim();
			}
			return undefined;
		} catch (error: unknown) {
			return undefined;
		}
	}

	async killProcess(): Promise<void> {
		const pid = await this.findNgrokProcessId();
		if (!pid) {
			this.logger.debug('Ngrok process not found');
			return;
		}
		this.logger.debug(`Killing ngrok process with pid ${pid}`);
		await $`kill -9 ${pid}`;
	}

	// Function to handle cleanup and exit signals
	private setupSignalHandlers() {
		const signals = ["SIGTERM", "SIGINT", "SIGHUP"];
		signals.forEach((signal) =>
			process.on(signal, async () => {
				this.logger.info(`Received ${signal}. Cleaning up...`);
				await this.killProcess();
				this.logger.info('Exiting...');
				process.exit(0);
			})
		);
	};

	async preStart(): Promise<void> {
		if (!this.options.preStart) {
			return;
		}
		// Get the tunnel URL
		const tunnelResourceInfoUrl = `http://localhost:${this.options.ngrokPort}/api/tunnels`;
		await this.waitUntilUrlReady(tunnelResourceInfoUrl, 'Ngrok Tunnel');
		const tunnelUrl = await this.getTunnelUrl(tunnelResourceInfoUrl);
		if (!tunnelUrl) {
			throw new Error('Failed to get Ngrok tunnel Public URL');
		}
		// Run the preStart function
		this.options.preStart(tunnelUrl);
	}

	async getTunnelUrl(url: string): Promise<string | undefined> {
		const tunnelResponse = await fetch(url);
		// Somehow fetch api convert xml to json automatically
		const tunnelJson = await tunnelResponse.text()
		const tunnelResourceInfo = this.getTunnelResourceInfo(JSON.parse(tunnelJson));
		if (tunnelResourceInfo.tunnels.length > 0) {
			return tunnelResourceInfo.tunnels[0].public_url;
		}
		return undefined;
	}

	/**
	 * Internal method to check if the backend is ready.
	 */
	async waitUntilUrlReady(url: string, serviceName: string): Promise<void> {
		const isBackendReady = async (): Promise<boolean> => {
			try {
				const response = await fetch(url, { method: 'GET' });
				return response.status === 200;
			} catch (error) {
				// Assuming non-200 or fetch errors mean the tunnel is not ready yet.
				this.logger.info(`"${serviceName}" is not ready yet`);
				return false;
			}
		};

		while (!(await isBackendReady())) {
			await new Promise(resolve => setTimeout(resolve, this.options.healthCheckInterval));
		}
		this.logger.info(`"${serviceName}" is ready`);
	}

	getTunnelResourceInfo(tunnelResourceInfo: unknown): z.infer<typeof TunnelNgrokManager.resourceInfoSchema> {
		try {
			return TunnelNgrokManager.resourceInfoSchema.parse(tunnelResourceInfo);
		} catch (error: unknown) {
			this.logger.error(getErrorMessage(error));
			throw new Error('Invalid Ngrok Tunnel Resource Info schema, ngrok may have changed its API');
		}
	}
}
