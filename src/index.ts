
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { webhookCallback } from "grammy";
import { BotApp } from "./bot/bot";
import { getEnv } from "./env";

export default {
	async fetch(
		request: Request,
		rawEnv: unknown,
		ctx: ExecutionContext,
	): Promise<Response> {
		const env = getEnv(rawEnv);
		const botApp = new BotApp(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO), allowUserIds: env.ALLOWED_USER_IDS }).init();
		return webhookCallback(botApp.instance, "cloudflare-mod")(request);
	},
} satisfies ExportedHandler<Env>;
