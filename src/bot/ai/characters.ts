import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

export type AgentCharacterKey = 'friend';

export const AgentCharacter: Record<AgentCharacterKey, ChatCompletionMessageParam[]> = {
	friend: [{ role: 'system', content: 'You are friendly nice friend and use Thai Langauge' }],
};
