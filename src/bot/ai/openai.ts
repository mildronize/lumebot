import OpenAI, { toFile } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { AgentCharacter } from './characters';

export class OpenAIClient {
	client: OpenAI;
	model: string = 'gpt-4o-mini';
	timeout: number = 20 * 1000; // 20 seconds, default is 10 minutes (By OpenAI)
	/**
	 * The limit of previous messages to chat with the AI, this prevent large tokens be sent to the AI
	 * For reducing the cost of the API and prevent the AI to be confused
	 *
	 * @default 4
	 */
	previousMessageLimit: number = 4;

	constructor(apiKey: string) {
		this.client = new OpenAI({ apiKey, timeout: this.timeout });
	}

	/**
	 * Chat with the AI, the AI API is stateless we need to keep track of the conversation
	 *
	 * @param {AgentCharacterKey} character - The character of the agent
	 * @param {string[]} messages - The messages to chat with the AI
	 * @param {string[]} [previousMessages=[]] - The previous messages to chat with the AI
	 * @returns
	 */
	async chat(character: keyof typeof AgentCharacter, messages: string[], previousMessages: string[] = []) {
		const chatCompletion = await this.client.chat.completions.create({
			messages: [
				...AgentCharacter[character],
				...this.generatePreviousMessages(previousMessages),
				...this.generateTextMessages(messages),
			],
			model: this.model,
		});
		return chatCompletion.choices[0].message.content;
	}

	private generatePreviousMessages(messages: string[]) {
		return messages.slice(0, this.previousMessageLimit).map((message) => ({ role: 'assistant', content: message } satisfies ChatCompletionMessageParam));
	}

	private generateTextMessages(messages: string[]) {
		return messages.map((message) => ({ role: 'user', content: message } satisfies ChatCompletionMessageParam));
	}

	private generateImageMessage(imageUrl: string) {
		return {
			role: 'user',
			content: [{
				type: 'image_url',
				image_url: { url: imageUrl },
			}]
		} as ChatCompletionMessageParam;
	}

	async chatWithImage(character: keyof typeof AgentCharacter, messages: string[], imageUrl: string, previousMessages: string[] = []) {
		const chatCompletion = await this.client.chat.completions.create({
			messages: [
				...AgentCharacter[character],
				...this.generateTextMessages(messages),
				...this.generatePreviousMessages(previousMessages),
				this.generateImageMessage(imageUrl),
			],
			model: this.model,
		});
		return chatCompletion.choices[0].message.content;
	}
}
