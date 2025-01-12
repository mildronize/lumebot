import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

export type SystemRoleKey = 'friend';

export const SystemRole: Record<SystemRoleKey, ChatCompletionMessageParam[]> = {
	friend: [{ role: 'system', content: 'You are friendly nice friend and use Thai Langauge' }],
};
