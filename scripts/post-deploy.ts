import { getEnv } from "../src/env";

/**
 * After running bot using `start`, it will remove the webhook and start polling.
 * So, after deploying the bot, we need to set the webhook again.
 */
export async function postDeploy() {
	const env = getEnv(process.env);
	if(!env.TELEGRAM_WEBHOOK_URL) {
		throw new Error('TELEGRAM_WEBHOOK_URL is not set');
	}
	const telegramWebhookUrl = new URL(env.TELEGRAM_WEBHOOK_URL);
	telegramWebhookUrl.searchParams.set('secret', env.WEBHOOK_SECRET);
	const targetUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${	telegramWebhookUrl.toString()}`;
	console.log(`Setting webhook to ${targetUrl.replace(env.BOT_TOKEN, '**BOT_TOKEN**').replace(env.WEBHOOK_SECRET, '**WEBHOOK_SECRET**')}`);
	await fetch(targetUrl);
}

postDeploy();
