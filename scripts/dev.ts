
import { BotApp } from "../src/bot/bot";
import { getEnv } from "./env";
import { generateUpdateMiddleware } from "telegraf-middleware-console-time";
/**
 * Start the development server
 */
const env = getEnv(process.env);
export async function startDev() {
	console.log('Start dev server');
	const bot = new BotApp(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) });
	bot.instance.use(generateUpdateMiddleware());
	bot.init();
	await bot.start();
}

startDev();
