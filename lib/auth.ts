import crypto from "crypto";

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || process.env.NEXT_PUBLIC_DEV_LOGIN === "true") return true;

  const { hash, ...rest } = data;
  const checkString = Object.entries(rest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  const isValid = hmac === hash;
  const isRecent = Date.now() / 1000 - data.auth_date < 86400; // 24h

  return isValid && isRecent;
}

export function verifyBotWebhook(token: string): boolean {
  return token === process.env.TELEGRAM_BOT_TOKEN;
}
