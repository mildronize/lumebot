import { z, ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';

export const envSchema = z.object({
	BOT_TOKEN: z.string(),
	BOT_INFO: z.string(),
	TELEGRAM_WEBHOOK_URL: z.string(),
});
export function getEnv(env: Record<string, string | undefined>) {
	try{
		return envSchema.parse(env);
	} catch(error: unknown) {
		if (error instanceof ZodError) {
			console.error(fromZodError(error).message);
		} else {
			console.error('Unknown error', error);
		}
		process.exit(1);
	}
}
