import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { AgentCharacter } from './characters';

export class OpenAIClient {
	client: OpenAI;
	model: string = 'gpt-4o-mini';
	timeout: number = 20 * 1000; // 20 seconds, default is 10 minutes (By OpenAI)

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
				...previousMessages.map((message) => ({ role: 'assistant', content: message } satisfies ChatCompletionMessageParam)),
				...messages.map((message) => ({ role: 'user', content: message } satisfies ChatCompletionMessageParam)),
			],
			model: this.model,
		});
		return chatCompletion.choices[0].message.content;
	}
}
