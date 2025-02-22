import { z, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { getErrorMessage } from '../scripts/utils/error';

export const envSchema = z.object({
  NODE_ENV: z.string().default('production'),
  BOT_TOKEN: z.string(),
  BOT_INFO: z.string(),
  /**
   * Comma separated list of user ids
   * Accept only messages from these users
   *
   * Example: 1234567890,0987654321
   * Convert to: [1234567890, 0987654321]
   *
   */
  ALLOWED_USER_IDS: z.preprocess((val: unknown) => {
    if (val === '' || val === undefined || val === null) return [];
    if (typeof val === 'number') return [val];
    return typeof val === 'string' ? val.trim().split(',').map(Number) : [];
  }, z.array(z.number())),
  /**
   * Protected Bot
   *
   * @default true
   */
  PROTECTED_BOT: z.boolean().default(true),
  /**
   * OpenAI API Key
   */
  OPENAI_API_KEY: z.string(),
  /**
   * Azure Table Connection String
   */
  AZURE_TABLE_CONNECTION_STRING: z.string(),
  /**
   * Use for share multiple app in one Azure Storage Account
   */
  AZURE_TABLE_PREFIX: z.string().default('MyBot'),

	/**
	 * Notion Key
	 */
	NOTION_KEY: z.string().optional(),
	/**
	 * Notion Database ID
	 */
	NOTION_DATABASE_ID: z.string().optional(),
});

/**
 * Development Environment Schema
 */
export const developmentEnvSchema = envSchema.extend({
  /**
   * Telegram webhook URL
   */
  TELEGRAM_WEBHOOK_URL: z.string(),
  /**
   * Azure Functions Name
   */
  AZURE_FUNCTIONS_NAME: z.string(),
  /**
   * Azure Functions App Name
   */
  AZURE_FUNCTIONS_APP_NAME: z.string(),
  /**
   * Azure Functions Resource Group
   */
  AZURE_FUNCTIONS_RESOURCE_GROUP: z.string(),
  /**
   * Azure Functions Subscription
   */
  AZURE_FUNCTIONS_SUBSCRIPTION: z.string(),
});

export function getDevelopmentEnv(env: unknown) {
  try {
    return developmentEnvSchema.parse(env);
  } catch (error: unknown) {
    console.error(getErrorMessage(error));
    throw new Error('Invalid environment variables');
  }
}

export function getEnv(env: unknown) {
  try {
    return envSchema.parse(env);
  } catch (error: unknown) {
    console.error(getErrorMessage(error));
    throw new Error('Invalid environment variables');
  }
}
