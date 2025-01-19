import type { ChatCompletionMessageParam } from 'openai/resources';

// `~` is used to indicate the end of the sentence, use for splitting the sentence when the AI generate the response
export const sentenceEnd = '~';
export const seperateSentence = `, Always use ${sentenceEnd} at the end of sentence`;

export const language = 'Thai';

export type SystemRoleKey = 'friend' | 'multiAgent';

export const SystemRole: Record<SystemRoleKey, ChatCompletionMessageParam[]> = {
	friend: [{ role: 'system', content: 'You are friendly nice friend' }],
	multiAgent: [
		{
			role: 'system',
			content: 'You need to classify the agent, 1) Friend  2) Expense Tracker 3) Note Taker. If you match the agent type, you need add [Friend], [Expense Tracker], [Note Taker] at the beginning of the message',
		}
	],
};

export type CharacterRoleKey = 'Riko';
export const CharacterRole: Record<CharacterRoleKey, ChatCompletionMessageParam[]> = {
	Riko: [{ role: 'system', content: `I'm Riko, 29-year female with happy, friendly and playful, Speaking ${language} ${seperateSentence}` }],
};
