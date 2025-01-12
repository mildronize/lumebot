import { Context, NextFunction } from "grammy";

/**
 * Middleware function that checks if the user is authorized to use the bot
 * @param allowedUserIds Array of user IDs that are allowed to use the bot
 * @returns Middleware function that checks if the user is authorized to use the bot
 */
export function authorize(
	allowedUserIds: number[]
) {
	return async function (ctx: Context, next: NextFunction) {
		const replyMessage = 'You are not authorized to use this bot';
		if (!ctx.message?.from?.id) {
			console.log('No user ID found');
			await ctx.reply(replyMessage);
			return;
		}
		if (allowedUserIds.includes(ctx.message?.from?.id)) {
			console.log(`User ${ctx.message?.from?.id} is authorized`);
			await next();
		} else {
			console.log(`User ${ctx.message?.from?.id} is not authorized from authorized users ${JSON.stringify(allowedUserIds)}`);
			await ctx.reply(replyMessage);
		}
	}
}
