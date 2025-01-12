import { Bot, Context } from "grammy";
import type { UserFromGetMe } from "grammy/types";

export interface BotAppOptions {
	botInfo?: UserFromGetMe;
}

export class BotApp {
	private bot: Bot;
	constructor(botToken: string, public options: BotAppOptions) {
		this.bot = new Bot(botToken, options);
		this.init();
	}

	init() {
		console.log('BotApp init');
		this.bot.command("start", async (ctx: Context) => {
			await ctx.reply(`Hello, I am ${this.bot.botInfo.first_name} (From Cloudflare Workers)`);
		});
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
