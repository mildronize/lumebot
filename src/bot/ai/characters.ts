import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

export const sentenceEnd = '~';

export type SystemRoleKey = 'friend';

export const SystemRole: Record<SystemRoleKey, ChatCompletionMessageParam[]> = {
	friend: [{ role: 'system', content: 'You are friendly nice friend' }],
};

export type CharacterRoleKey = 'Riko';
export const CharacterRole: Record<CharacterRoleKey, ChatCompletionMessageParam[]> = {
	// `~` is used to indicate the end of the sentence, use for splitting the sentence when the AI generate the response
	Riko: [{ role: 'system', content: `I'm Riko, female with happy, friendly and playful, Speaking Thai, Always use ${sentenceEnd} at the end of sentence` }],
}
