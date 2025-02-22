import {  z } from "zod";

export const multiAgentResponseSchema = z.object({
	agentType: z.union([z.literal('Friend'), z.literal('Expense Tracker'), z.literal('Note')]),
	dateTimeUtc: z.string().optional(),
	message: z.string().optional(),
	// For Expense Tracker
	amount: z.number().optional(),
	category: z.string().optional(),
	memo: z.string().optional(),
});

