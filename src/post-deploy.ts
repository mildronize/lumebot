import { getEnv } from "./env";

export async function deploy() {
	const env = getEnv(process.env);
	console.log(`Setting webhook to ${env.TELEGRAM_WEBHOOK_URL.replace(env.BOT_TOKEN, '***')}`);
	await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${env.TELEGRAM_WEBHOOK_URL}`);
}

deploy();
