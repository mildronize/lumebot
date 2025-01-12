# Grammybot

## Dev

```
bun install
bun dev
```

## Deploy

Setup Secret
```sh
# Setup BOT_TOKEN for Telegram Bot Token getting from BotFather
npx wrangler secret put BOT_TOKEN
# Setup WEBHOOK_SECRET for Telegram Webhook Secret, random string, avoid special characters for better URL encoding
npx wrangler secret put WEBHOOK_SECRET
```

Deploy

```
bun install
bun run deploy
```

https://grammy.dev/hosting/cloudflare-workers-nodejs
