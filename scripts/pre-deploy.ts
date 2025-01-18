import 'dotenv/config';

import { getEnv } from "../src/env";
import { config } from './_config';
import { TunnelNgrokManager } from './libs/TunnelNgrokManager';
import { createPinoLogger } from './utils/logger';
import { TelegramBotClient } from './libs/TelegramClient';

/**
 * After running bot using `start`, it will remove the webhook and start polling.
 * So, after deploying the bot, we need to set the webhook again.
 */
export async function preDeploy() {
	const env = getEnv(process.env);

	// Handle renew secret
	// const secretManager = new SecretManager({ localEnvPath: config.localEnvPath, renew: config.renew });
	// const renewSecret = await secretManager.start();
	// const secret = config.renew ? renewSecret : env.WEBHOOK_SECRET ?? renewSecret;
	const secret = '';

	// Handle set webhook
	if (!env.TELEGRAM_WEBHOOK_URL) {
		throw new Error('TELEGRAM_WEBHOOK_URL is not set');
	}
	const telegramWebhookUrl = new URL(env.TELEGRAM_WEBHOOK_URL);
	// TODO: Use Azure Function Token instead
	// telegramWebhookUrl.searchParams.set('secret', secret);
	const targetUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${telegramWebhookUrl.toString()}`;
	console.log(`Setting webhook to ${targetUrl.replace(env.BOT_TOKEN, '**BOT_TOKEN**').replace(secret, '**WEBHOOK_SECRET**')}`);
	await fetch(targetUrl);
}

function startTunnel() {
	const env = getEnv(process.env);
	const tunnelManager = new TunnelNgrokManager({
		logger: createPinoLogger('tunnel', config.logLevel),
		preStart: async (tunnelUrl, logger) => {
			const telegramBotClient = new TelegramBotClient({
				token: env.BOT_TOKEN,
				logger,
			});
			await telegramBotClient.setWebhook(tunnelUrl + '/api/telegramBot');
		}
	});
	tunnelManager.start();
}

startTunnel();

// preDeploy();
