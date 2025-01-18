import { ConsoleLogger, Logger } from "../utils/logger";

export interface TelegramBotClientOptions {
	logger?: Logger;
	token: string;
}

export class TelegramBotClient {
	private logger: Logger;
	constructor(private readonly options: TelegramBotClientOptions) {
		this.logger = options.logger ?? new ConsoleLogger();
	}

	async setWebhook(url: string) {
		const targetUrl = `https://api.telegram.org/bot${this.options.token}/setWebhook?url=${url}`;
		this.logger.info(`Setting webhook to ${targetUrl.replace(this.options.token, '**BOT_TOKEN**')}`);
		await fetch(targetUrl);
	}
}
