import { Bot, Context } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import { authorize } from "../middlewares/authorize";
import { OpenAIClient } from "./ai/openai";

export interface BotAppOptions {
	botToken: string;
	aiClient: OpenAIClient;
	botInfo?: UserFromGetMe;
	allowUserIds?: number[];
	protectedBot?: boolean;
}

export class BotApp {
	private bot: Bot;
	private protectedBot: boolean;
	constructor(public options: BotAppOptions) {
		this.bot = new Bot(options.botToken, {
			botInfo: options.botInfo,
		});
		this.protectedBot = options.protectedBot ?? true;
	}

	init() {
		console.log('BotApp init');
		if (this.protectedBot === true) {
			this.bot.use(authorize(this.options.allowUserIds ?? []));
		}
		this.bot.command("start", async (ctx: Context) => {
			await ctx.reply(`Hello, I am ${this.bot.botInfo.first_name} (From Cloudflare Workers) XX`);
		});
		this.bot.command("whoiam", async (ctx: Context) => {
			await ctx.reply(`You are ${ctx.from?.first_name} (id: ${ctx.message?.from?.id})`);
		});
		this.bot.api.setMyCommands([
			{ command: 'start', description: 'Start the bot' },
			{ command: 'whoiam', description: 'Who am I' },
		]);
		this.bot.on('message', async (ctx: Context) => this.messageHandler(ctx, this.options.aiClient));
		this.bot.catch((err) => {
			console.error('Bot error', err);
		});
		return this;
	}

	async start() {
		await this.bot.start({
			onStart(botInfo) {
				console.log(new Date(), 'Bot starts as', botInfo.username);
			},
		});
	}

	private async messageHandler(ctx: Context, aiClient: OpenAIClient) {
		if(!aiClient) {
			await ctx.reply('Sorry, I cannot understand you (aiClient is not available)');
			return;
		}
		if(!ctx.message?.text) {
			await ctx.reply('Please send a text message');
			return;
		}
		// For chaining the conversation, we need to keep track of the previous messages
		// Example of chaining the conversation:
		// const message = await aiClient.chat('friend', [ctx.message?.text], ['Previous question: What is your favorite color','Previous response: blue']);

		const message = await aiClient.chat('friend', [ctx.message?.text]);
		if(!message) {
			await ctx.reply('Sorry, I cannot understand you');
			return;
		}
		await ctx.reply(message);
	}

	get instance() {
		return this.bot;
	}
}
