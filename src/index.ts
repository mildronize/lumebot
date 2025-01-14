
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
import { OpenAIClient } from "./bot/ai/openai";
import { AzureTable } from "./libs/azure-table";
import { IMessageEntity } from "./entities/messages";
import { TableClient } from "@azure/data-tables";

export default {
	async fetch(
		request: Request,
		rawEnv: unknown,
		ctx: ExecutionContext,
	): Promise<Response> {
		const env = getEnv(rawEnv);
		const aiClient = new OpenAIClient(env.OPENAI_API_KEY);
		const azureTableClient = {
			messages: new AzureTable<IMessageEntity>(
				TableClient.fromConnectionString(env.AZURE_TABLE_CONNECTION_STRING, `${env.AZURE_TABLE_PREFIX}Bot`)
			)
		}
		await azureTableClient.messages.createTable();
		const botApp = new BotApp({
			botToken: env.BOT_TOKEN,
			botInfo: JSON.parse(env.BOT_INFO),
			allowUserIds: env.ALLOWED_USER_IDS,
			aiClient,
			azureTableClient
		});
		botApp.init();
		try {
			const url = new URL(request.url);
			if (url.searchParams.get("secret") !== env.WEBHOOK_SECRET) {
				return new Response("Not allowed", { status: 405 });
			}
			return webhookCallback(botApp.instance, "cloudflare-mod")(request);
		} catch (err) {
			console.error(`Error: ${err}`);
			return new Response("Error", { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
