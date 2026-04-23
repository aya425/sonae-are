/**
 * 共通 logger 基盤
 *
 * 使い方:
 * logger.debug("debug message", { feature: "sample" });
 * logger.info("info message", { userId: "xxx" });
 * logger.warn("warn message", { path: "/api/sample" });
 * logger.error("error message", { errorCode: "SAMPLE_ERROR" });
 *
 * 方針:
 * - 開発環境では debug / info / warn / error を出力する
 * - 本番環境では info / warn / error を出力する
 * - 秘密情報や個人情報に該当しうるキーは [REDACTED] にマスクする
 */
type LogLevel = "debug" | "info" | "warn" | "error";

// API やバッチ処理から渡す追加情報
type LogMeta = Record<string, unknown>;

// ログレベルの優先度定義
const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// 本番では info 以上、開発では debug 以上を出力する
function getMinLogLevel(): LogLevel {
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[getMinLogLevel()];
}

// 秘密情報や個人情報に該当しうるキーをマスクする
function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return undefined;

  // ログにそのまま出さないキー一覧
  const blockedKeys = [
    "password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "apiKey",
    "api_key",
    "secret",
    "secretKey",
    "secret_key",
    "webhookSecret",
    "stripeWebhookSecret",
    "supabaseServiceRoleKey",
    "openAiApiKey",
    "openaiApiKey",
    "cookie",
    "cookies",
    "mailBody",
    "prompt",
  ];

  const sanitizedEntries = Object.entries(meta).map(([key, value]) => {
    const shouldMask = blockedKeys.some(
      (blockedKey) => blockedKey.toLowerCase() === key.toLowerCase()
    );

    if (shouldMask) {
      return [key, "[REDACTED]"];
    }

    return [key, value];
  });

  return Object.fromEntries(sanitizedEntries);
}

// 環境に応じてログの出力形式を整える
function formatLog(level: LogLevel, message: string, meta?: LogMeta) {
  const base = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  const sanitizedMeta = sanitizeMeta(meta);

  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      ...base,
      ...(sanitizedMeta ? { meta: sanitizedMeta } : {}),
    });
  }

  return {
    ...base,
    ...(sanitizedMeta ? { meta: sanitizedMeta } : {}),
  };
}

// 実際のログ出力を行う
function writeLog(level: LogLevel, message: string, meta?: LogMeta) {
  if (!shouldLog(level)) return;

  const payload = formatLog(level, message, meta);

  switch (level) {
    case "debug":
      console.debug(payload);
      break;
    case "info":
      console.info(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    case "error":
      console.error(payload);
      break;
    default:
      console.log(payload);
  }
}

// アプリ全体で共通利用する logger
export const logger = {
  debug(message: string, meta?: LogMeta) {
    writeLog("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    writeLog("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    writeLog("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    writeLog("error", message, meta);
  },
};
