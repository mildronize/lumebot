import { Bot, Context } from "grammy";
import type { UserFromGetMe } from "grammy/types";

import { authorize } from "../middlewares/authorize";
import { OpenAIClient } from "./ai/openai";

type BotAppContext = Context;

export interface TelegramMessageType {
	/**
	 * Incoming text message
	 */
	text?: string;
	/**
	 * Incoming caption message (with photo)
	 */
	caption?: string;
	/**
	 * Incoming photo file_path
	 */
	photo?: string;
	/**
	 * Incoming audio file_path
	 */
	// audio?: string;
}

export interface BotAppOptions {
	botToken: string;
	aiClient: OpenAIClient;
	botInfo?: UserFromGetMe;
	allowUserIds?: number[];
	protectedBot?: boolean;
}

export class TelegramApiClient {
	baseUrl = 'https://api.telegram.org';
	constructor(public botToken: string) { }

	async getMe() {
		const response = await fetch(`${this.baseUrl}/bot${this.botToken}/getMe`);
		if (!response.ok) {
			throw new Error(`Failed to get the bot info: ${response.statusText}`);
		}
		const data = await response.json();
		return data;
	}

	/**
	 * Get Download URL for the file
	 *
	 * @ref https://core.telegram.org/bots/api#getfile
	 * @param filePath
	 * @returns
	 */

	getFileUrl(filePath: string): string {
		return `${this.baseUrl}/file/bot${this.botToken}/${filePath}`;
	}
}

export class BotApp {
	private bot: Bot<BotAppContext>;
	private telegram: TelegramApiClient;
	private protectedBot: boolean;
	constructor(public options: BotAppOptions) {
		this.bot = new Bot<BotAppContext>(options.botToken, {
			botInfo: options.botInfo,
		});
		this.telegram = new TelegramApiClient(options.botToken);
		this.protectedBot = options.protectedBot ?? true;
	}

	init() {
		console.log('BotApp init');
		if (this.protectedBot === true) {
			this.bot.use(authorize(this.options.allowUserIds ?? []));
		}
		// Use the hydrateFiles middleware to enable file handling
		// this.bot.api.config.use(hydrateFiles(this.options.botToken));
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
		this.bot.on('message', async (ctx: Context) => this.allMessagesHandler(ctx, this.options.aiClient, this.telegram));
		// this.bot.on('message', async (ctx: BotAppContext) => this.messageAndPhotoHandler(ctx, this.telegram));
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

	private async handlePhoto(ctx: BotAppContext, aiClient: OpenAIClient, photo: { file_path: string, caption?: string }) {
		const incomingMessages = photo.caption ? [photo.caption] : [];
		const message = await aiClient.chatWithImage('friend', incomingMessages, photo.file_path);
		if (!message) {
			await ctx.reply('Sorry, I cannot understand you');
			return;
		}
		await ctx.reply(message);
	}

	private async allMessagesHandler(ctx: Context, aiClient: OpenAIClient, telegram: TelegramApiClient) {
		// classifying the message type
		const messages: TelegramMessageType = {
			text: ctx.message?.text,
			caption: ctx.message?.caption,
			photo: ctx.message?.photo ? (await ctx.getFile()).file_path : undefined,
		}
		if (messages.text === undefined && messages.caption === undefined && messages.photo === undefined) {
			await ctx.reply(`I don't understand that messages type`);
			return;
		}

		const incomingMessage = messages.text || messages.caption;
		if (messages.photo) {
			const photoUrl = telegram.getFileUrl(messages.photo);
			await this.handlePhoto(ctx, aiClient, { file_path: photoUrl, caption: incomingMessage });
			return;
		}
		await this.handleMessageText(ctx, aiClient, incomingMessage);
	}

	private async handleMessageText(ctx: Context, aiClient: OpenAIClient, incomingMessage: string | undefined) {
		if (!aiClient) {
			await ctx.reply('Sorry, I cannot understand you (aiClient is not available)');
			return;
		}
		if (!incomingMessage) {
			await ctx.reply('Please send a text message');
			return;
		}
		// For chaining the conversation, we need to keep track of the previous messages
		// Example of chaining the conversation:
		// const message = await aiClient.chat('friend', [ctx.message?.text], ['Previous question: What is your favorite color','Previous response: blue']);

		const message = await aiClient.chat('friend', [incomingMessage]);
		if (!message) {
			await ctx.reply('Sorry, I cannot understand you');
			return;
		}
		await ctx.reply(message);
	}

	get instance() {
		return this.bot;
	}
}
