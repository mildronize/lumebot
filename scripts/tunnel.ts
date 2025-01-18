import 'dotenv/config';

import { getDevelopmentEnv } from '../src/env';
import { config } from './_config';
import { TunnelNgrokManager } from './libs/TunnelNgrokManager';
import { createPinoLogger } from './utils/logger';
import { TelegramBotClient } from './libs/TelegramClient';

function startTunnel() {
  const env = getDevelopmentEnv(process.env);
  const tunnelManager = new TunnelNgrokManager({
    logger: createPinoLogger('tunnel', config.logLevel),
    preStart: async (tunnelUrl, logger) => {
      const telegramBotClient = new TelegramBotClient({
        token: env.BOT_TOKEN,
        logger,
      });
      await telegramBotClient.setWebhook(new URL(config.telegramWebhookPath, tunnelUrl).toString());
    },
  });
  tunnelManager.start();
}

startTunnel();
