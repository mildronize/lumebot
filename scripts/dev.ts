
import dotenv from 'dotenv';

import { BotApp } from "../src/bot/bot";
import { getEnv } from "../src/env";
import { generateUpdateMiddleware } from "telegraf-middleware-console-time";
import { config } from "./_config";
import { OpenAIClient } from '../src/bot/ai/openai';
import { AzureTable } from '../src/libs/azure-table';
import { IMessageEntity } from '../src/entities/messages';
import { TableClient } from '@azure/data-tables';

// Use the same file of Wrangler Runtime
dotenv.config({ path: config.localEnvPath });
/**
 * Start the development server
 */
const env = getEnv(process.env);
export async function startDev() {
	console.log('Start dev server');
	const aiClient = new OpenAIClient(env.OPENAI_API_KEY);
	const azureTableClient = {
		messages: new AzureTable<IMessageEntity>(
			TableClient.fromConnectionString(env.AZURE_TABLE_CONNECTION_STRING, `${env.AZURE_TABLE_PREFIX}Bot`)
		)
	}
	await azureTableClient.messages.createTable();
	const bot = new BotApp({
		botToken: env.BOT_TOKEN,
		botInfo: JSON.parse(env.BOT_INFO),
		allowUserIds: env.ALLOWED_USER_IDS,
		aiClient,
		azureTableClient
	});
	bot.instance.use(generateUpdateMiddleware());
	bot.init();
	await bot.start();
}

startDev();
