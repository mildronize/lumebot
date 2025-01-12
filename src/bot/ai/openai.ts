import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { SystemRole, CharacterRole, sentenceEnd } from './characters';

export class OpenAIClient {
	characterRole: keyof typeof CharacterRole;
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
	/**
	 * The answer mode of the AI, this is the default answer mode of the AI
	 * Use this to prevent the AI to generate long answers or to be confused
	 */
	// answerMode = 'The answers are within 4 sentences';
	/**
	 * Split the sentence when the AI generate the response,
	 * Prevent not to generate long answers, reply with multiple chat messages
	 */
	splitSentence: boolean = true;

	constructor(apiKey: string) {
		this.client = new OpenAI({ apiKey, timeout: this.timeout });
		this.characterRole = 'Riko';
	}

	/**
 * The answer mode of the AI, this is the default answer mode of the AI
 * Use this to prevent the AI to generate long answers or to be confused
 */
	private dynamicLimitAnswerSentences(start: number, end: number) {
		const answerMode = `The answers are within XXX sentences`;
		const randomLimit = Math.floor(Math.random() * (end - start + 1)) + start;
		return answerMode.replace('XXX', randomLimit.toString());
	}

	/**
	 * Chat with the AI, the AI API is stateless we need to keep track of the conversation
	 *
	 * @param {AgentCharacterKey} character - The character of the agent
	 * @param {string[]} messages - The messages to chat with the AI
	 * @param {string[]} [previousMessages=[]] - The previous messages to chat with the AI
	 * @returns
	 */
	async chat(character: keyof typeof SystemRole, messages: string[], previousMessages: string[] = []): Promise<string[]> {
		const chatCompletion = await this.client.chat.completions.create({
			messages: [
				...SystemRole[character],
				...CharacterRole[this.characterRole],
				...this.generateSystemMessages([this.dynamicLimitAnswerSentences(2, 5)]),
				// ...this.generateSystemMessages([this.answerMode]),
				...this.generatePreviousMessages(previousMessages),
				...this.generateTextMessages(messages),
			],
			model: this.model,
		});
		const response = chatCompletion.choices[0].message.content ?? '';
		if (this.splitSentence) {
			return response.split(sentenceEnd);
		}
		return [response];
	}

	private generateSystemMessages(messages: string[]) {
		return messages.map((message) => ({ role: 'system', content: message } satisfies ChatCompletionMessageParam));
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

	async chatWithImage(character: keyof typeof SystemRole, messages: string[], imageUrl: string, previousMessages: string[] = []) {
		const chatCompletion = await this.client.chat.completions.create({
			messages: [
				...SystemRole[character],
				...this.generateTextMessages(messages),
				...this.generatePreviousMessages(previousMessages),
				this.generateImageMessage(imageUrl),
			],
			model: this.model,
		});
		return chatCompletion.choices[0].message.content;
	}
}
