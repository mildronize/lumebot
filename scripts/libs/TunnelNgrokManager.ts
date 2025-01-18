import { $ } from "bun";
import { TunnelManager } from "./interfaces/TunnelManager";
import { XMLParser } from "fast-xml-parser";
import fs from 'fs';
import path from "path";

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
}

export class TunnelNgrokManager implements TunnelManager {
	public options: TunnelNgrokManagerOptions;
	public static readonly defaultOptions: TunnelNgrokManagerOptions = {
		forwardPort: 7071,
		ngrokPort: 4040,
		logPath: './.logs/ngrok.log',
		healthCheckUrl: 'http://localhost:7071/',
		healthCheckInterval: 1000,
	};

	constructor(options?: Partial<TunnelNgrokManagerOptions>) {
		this.options = Object.assign({}, TunnelNgrokManager.defaultOptions, options);
		// console.log('TunnelNgrokManager created with options:', this.options);
	}

	async start(): Promise<void> {
		try {
			console.log('Starting tunnel');
			fs.mkdirSync(path.dirname(this.options.logPath), { recursive: true });
			// const ngrokPromise = $`ngrok http ${this.options.forwardPort} --log=stdout > ${this.options.logPath}`;
			// Show backend status
			this.waitUntilUrlReady(this.options.healthCheckUrl, 'Backend');
			// Run preStart function
			this.preStart();
			// Setup signal handlers
			await this.setupNgrokSignalHandlers();
			// Start ngrok tunnel
			await $`ngrok http ${this.options.forwardPort} --log=stdout > ${this.options.logPath}`;
		}
		catch (error) {
			throw new Error(`Error starting ngrok tunnel: ${error}`);
		}
	}

	async setupNgrokSignalHandlers(): Promise<void> {
		const isWindows = process.platform === "win32";
		if (isWindows) {
			console.error("This script is not supported on Windows.");
			return;
		}
		const ngrokProcessId = await this.findNgrokProcessId();
		this.setupSignalHandlers(ngrokProcessId);
	}

	private async findNgrokProcessId(): Promise<string | null> {
		const processName = 'ngrok';
		const ngrokProcessId = await $`ps aux | grep ${processName} | grep -v grep | awk '{print $2}'`;
		if (ngrokProcessId) {
			return ngrokProcessId.stdout.toString().trim();
		}
		// Try to find the process id from port using lsof
		const ngrokProcessIdFromPort = await $`lsof -t -i :${this.options.ngrokPort}`;
		if (ngrokProcessIdFromPort) {
			return ngrokProcessIdFromPort.stdout.toString().trim();
		}
		return null;
	}

	async killProcess(pid: string, processName = 'ngrok'): Promise<void> {
		console.log(`Killing ${processName} process with pid ${pid}`);
		await $`kill -9 ${pid}`;
	}

	// Function to handle cleanup and exit signals
	private setupSignalHandlers(pid: string | null) {
		const signals = ["SIGTERM", "SIGINT", "SIGHUP"];
		signals.forEach((signal) =>
			process.on(signal, async () => {
				console.log(`Received ${signal}. Cleaning up...`);
				if (pid) await this.killProcess(pid);
				process.exit(0);
			})
		);
	};

	async preStart(): Promise<void> {
		if (!this.options.preStart) {
			return;
		}
		// Get the tunnel URL
		const tunnelMetadataUrl = `http://localhost:${this.options.ngrokPort}/api/tunnels`;
		await this.waitUntilUrlReady(tunnelMetadataUrl, 'Ngrok Tunnel');
		const tunnelUrl = await this.getTunnelUrl(tunnelMetadataUrl);
		console.log('Tunnel URL:', tunnelUrl);
		// Run the preStart function
		this.options.preStart(tunnelUrl);
	}

	async getTunnelUrl(url: string): Promise<string> {
		const tunnelResponse = await (await fetch(url)).text();
		console.log('Tunnel Response:', tunnelResponse);
		const tunnelJson = new XMLParser().parse(tunnelResponse);
		console.log('Tunnel JSON:', tunnelJson);
		return '';
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
				console.log(`"${serviceName}" is not ready yet`);
				return false;
			}
		};

		while (!(await isBackendReady())) {
			await new Promise(resolve => setTimeout(resolve, this.options.healthCheckInterval));
		}
		console.log(`"${serviceName}" is ready`);
	}

}
