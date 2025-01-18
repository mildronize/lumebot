import 'dotenv/config';

import { getDevelopmentEnv } from "../src/env";
import { TelegramBotClient } from './libs/TelegramClient';
import { config } from './_config';
import { AzureFunctionsClient } from './libs/AzureFunctionsClient';

export async function preDeploy() {
	const env = getDevelopmentEnv(process.env);
	const telegramBotClient = new TelegramBotClient({
		token: env.BOT_TOKEN,
	});
	const webhookUrl = new URL(config.telegramWebhookPath, env.TELEGRAM_WEBHOOK_URL);
	const code = await new AzureFunctionsClient({
		functionName: env.AZURE_FUNCTIONS_NAME,
		functionAppName: env.AZURE_FUNCTIONS_APP_NAME,
		resourceGroup: env.AZURE_FUNCTIONS_RESOURCE_GROUP,
		subscription: env.AZURE_FUNCTIONS_SUBSCRIPTION,
	}).getFunctionKey();
	if (!code) {
		throw new Error('Azure Function key is not set');
	}
	webhookUrl.searchParams.set('code', code);
	await telegramBotClient.setWebhook(webhookUrl.toString());
}

preDeploy();
