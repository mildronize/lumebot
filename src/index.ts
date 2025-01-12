
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

export interface Env {
	BOT_INFO: string;
	BOT_TOKEN: string;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const botApp = new BotApp(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) }).init();
		return webhookCallback(botApp.instance, "cloudflare-mod")(request);
	},
} satisfies ExportedHandler<Env>;
