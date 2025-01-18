import 'dotenv/config';

import { getEnv } from "../src/env";
import { TelegramBotClient } from './libs/TelegramClient';
import { config } from './_config';

export async function preDeploy() {
	const env = getEnv(process.env);

	if (!env.TELEGRAM_WEBHOOK_URL) {
		throw new Error('TELEGRAM_WEBHOOK_URL is not set');
	}
	const telegramBotClient = new TelegramBotClient({
		token: env.BOT_TOKEN,
	});
	await telegramBotClient.setWebhook(new URL(config.telegramWebhookPath, env.TELEGRAM_WEBHOOK_URL).toString());
}

preDeploy();
