import fs from 'fs';
import { $ } from 'bun';

export interface SecretManagerOptions {
  localEnvPath: string;
  renew: boolean;
}

export class SecretManager {
  constructor(public options: SecretManagerOptions) {
    console.log('SecretManager created');
  }

  async start(): Promise<string> {
    console.log('Starting secret generation');
    const secret = this.getSecret();
    if (!this.options.renew) {
      console.log('Renew option not set, skipping secret upload');
      return secret;
    }
    this.saveSecret(secret, this.options.localEnvPath);
    await this.uploadSecret(secret);
    return secret;
  }

  /**
   * Randomly generates a secret string of a given length.
   * @param length - Length of the secret string
   * @returns A randomly generated secret string
   */
  getSecret(length: number = 100): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    return result;
  }

  async saveSecret(secret: string, targetPath: string): Promise<void> {
    const localEnvExists = fs.existsSync(targetPath);
    if (!localEnvExists) {
      await fs.promises.writeFile(targetPath, '');
    }
    // Renew the secret, by replacing the old one
    let localEnv = fs.readFileSync(targetPath, 'utf-8');
    if (localEnv.includes('WEBHOOK_SECRET=')) {
      localEnv = localEnv.replace(/WEBHOOK_SECRET=.*/, `WEBHOOK_SECRET=${secret}`);
    } else {
      localEnv += `\nWEBHOOK_SECRET=${secret}`;
    }
    await fs.promises.writeFile(targetPath, localEnv);
  }

  async uploadSecret(secret: string): Promise<void> {
    // Upload the secret to Cloudflare Workers Secrets
    console.log('Uploading secret to Cloudflare Workers Secrets');
    const tmpFile = `.dev.tmp.vars`;
    await this.saveSecret(secret, tmpFile);
    await $`npx wrangler secret bulk ${tmpFile}`;
    // Clean up the temporary file
    fs.unlinkSync(tmpFile);
  }
}
