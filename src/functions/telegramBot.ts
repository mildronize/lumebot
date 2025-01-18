import { app } from '@azure/functions';
import { webhookCallback } from 'grammy';
import { bootstrap } from '../bootstrap';

const { bot, asyncTask } = bootstrap();

app.http('telegramBot', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: async (request, _context) => {
    await asyncTask();
    return webhookCallback(bot, 'azure-v4')(request as any);
  },
});
