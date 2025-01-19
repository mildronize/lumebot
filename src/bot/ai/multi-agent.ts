import { z } from "zod";

export const multiAgentResponseSchema = z.object({
	agentType: z.union([z.literal('Friend'), z.literal('Expense Tracker'), z.literal('Note Taker')]),
	message: z.string(),
});
