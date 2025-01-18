import { $ } from 'bun';
import { console } from 'inspector';

export interface AzureFunctionsClientOptions {
	functionName: string;
	functionAppName: string;
	resourceGroup: string;
	subscription: string;
}

export class AzureFunctionsClient {
	constructor(private readonly options: AzureFunctionsClientOptions) { }
	// https://thadaw-my-bot.azurewebsites.net/api/telegramBot?code=
	async getFunctionKey(keyName = 'default'): Promise<string | undefined> {
		try {
			const functionKeys = (await $`az functionapp function keys list --function-name ${this.options.functionName} --name ${this.options.functionAppName} --resource-group ${this.options.resourceGroup} --subscription "${this.options.subscription}"`).stdout.toString().trim();
			const key: Record<string, string | null> = JSON.parse(functionKeys);
			return key[keyName] ?? undefined;
		} catch (error) {
			console.error(error);
			return undefined;
		}
	}

}
