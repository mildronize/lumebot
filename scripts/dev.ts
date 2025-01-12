
import dotenv from 'dotenv';

import { BotApp } from "../src/bot/bot";
import { getEnv } from "../src/env";
import { generateUpdateMiddleware } from "telegraf-middleware-console-time";
import { config } from "./_config";
import { OpenAIClient } from '../src/bot/ai/openai';

// Use the same file of Wrangler Runtime
dotenv.config({ path: config.localEnvPath });
/**
 * Start the development server
 */
const env = getEnv(process.env);
export async function startDev() {
	console.log('Start dev server');
	const aiClient = new OpenAIClient(env.OPENAI_API_KEY);
	const bot = new BotApp({ botToken: env.BOT_TOKEN, botInfo: JSON.parse(env.BOT_INFO), allowUserIds: env.ALLOWED_USER_IDS, aiClient });
	bot.instance.use(generateUpdateMiddleware());
	bot.init();
	await bot.start();
}

startDev();
