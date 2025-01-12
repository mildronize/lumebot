import { Bot, Context } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import { authorize } from "../middlewares/authorize";

export interface BotAppOptions {
	botInfo?: UserFromGetMe;
	allowUserIds?: number[];
	protectedBot?: boolean;
}

export class BotApp {
	private bot: Bot;
	private protectedBot: boolean;
	constructor(botToken: string, public options: BotAppOptions) {
		this.bot = new Bot(botToken, options);
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
		return this;
	}

	async start() {
		await this.bot.start({
			onStart(botInfo) {
				console.log(new Date(), 'Bot starts as', botInfo.username);
			},
		});
	}

	get instance() {
		return this.bot;
	}
}
