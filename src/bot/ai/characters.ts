import type { ChatCompletionMessageParam } from 'openai/resources';

// `~` is used to indicate the end of the sentence, use for splitting the sentence when the AI generate the response
export const sentenceEnd = '~';
export const seperateSentence = `, Always use ${sentenceEnd} at the end of sentence`;

export const language = 'Thai';

export type SystemRoleKey = 'friend' | 'multiAgent' | 'bypassAgent';

export const SystemRole: Record<SystemRoleKey, ChatCompletionMessageParam[]> = {
	friend: [{ role: 'system', content: 'You are friendly nice friend' }],
	multiAgent: [
		{
			role: 'system',
			content: `
			You need to classify the agent:
				1) Expense Tracker, when related with expense, income, bill, receipt. Extract memo, amount and category, get dateTimeUtc based on the conversation relative to the current date
				2) Note, when related with note, reminder, to-do list. Extract memo, dateTimeUtc
				3) Friend, when other conversation, response with AI generated message
			`,
		},
		{
			role: 'system',
			content: `Understand the context of the conversation, extract possible context change possibility when compared with the previous conversation`,
		},
		{
			role: 'system',
			content: `Always use ${sentenceEnd} at the end of sentence`,
		}
	],
	bypassAgent: [
		{
			role: 'system',
			content: `
			Extract type of conversation, if not match with the agent, bypass the agent to regular conversation or AI generated message.
				1) Expense Tracker, when related with expense, income, bill, receipt
				2) Note, when related with note, reminder, to-do list.
			`,
		}
	]
};

export type CharacterRoleKey = 'Riko';
export const CharacterRole: Record<CharacterRoleKey, ChatCompletionMessageParam[]> = {
	Riko: [{ role: 'system', content: `I'm Riko, 29-year female with happy, friendly and playful, Speaking ${language} ${seperateSentence}` }],
};
