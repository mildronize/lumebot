import 'dotenv/config';
import { BotApp } from "./bot/bot";
import { getEnv } from "./env";
import { OpenAIClient } from "./bot/ai/openai";
import { AzureTable } from "./libs/azure-table";
import { IMessageEntity } from "./entities/messages";
import { TableClient } from "@azure/data-tables";

const env = getEnv(process.env);

export function bootstrap() {
	const aiClient = new OpenAIClient(env.OPENAI_API_KEY);
	const azureTableClient = {
		messages: new AzureTable<IMessageEntity>(
			TableClient.fromConnectionString(env.AZURE_TABLE_CONNECTION_STRING, `${env.AZURE_TABLE_PREFIX}Bot`)
		)
	}
	const botApp = new BotApp({
		botToken: env.BOT_TOKEN,
		botInfo: JSON.parse(env.BOT_INFO),
		allowUserIds: env.ALLOWED_USER_IDS,
		aiClient,
		azureTableClient
	});
	botApp.init();
	return {
		bot: botApp.instance,
		asyncTask: async () => {
			await azureTableClient.messages.createTable();
		}
	}
}
