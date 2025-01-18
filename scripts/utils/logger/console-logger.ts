
import { config } from "../../_config";
import { Logger, LogLevel } from "./logger";

export const createLogger = (scope: string): ConsoleLogger | undefined => new ConsoleLogger(scope, config.logLevel);

export class ConsoleLogger implements Logger {
  private static readonly LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
  private logLevelIndex: number;

  constructor(private scope?: string, level: LogLevel = "debug") {
    this.logLevelIndex = ConsoleLogger.LEVELS.indexOf(level.toUpperCase());
    if (this.logLevelIndex === -1) {
      throw new Error(`Invalid log level: ${level}. Valid levels are ${ConsoleLogger.LEVELS.join(", ")}.`);
    }
  }

  private logMessage(level: LogLevel, messages: unknown[]) {
    const levelIndex = ConsoleLogger.LEVELS.indexOf(level.toUpperCase());
    if (levelIndex < this.logLevelIndex) return;
    const formattedMessage = messages.join(" ");

    if (level === "debug") return console.debug(formattedMessage);
    if (level === "info") return console.info(formattedMessage);
    if (level === "warn") return console.warn(formattedMessage);
    return console.error(formattedMessage);
  }

  info(...messages: unknown[]) {
    this.logMessage("info", messages);
  }

  debug(...message: unknown[]) {
    this.logMessage("debug", message);
  }

  error(...message: unknown[]) {
    this.logMessage("error", message);
  }

  warn(...message: unknown[]) {
    this.logMessage("warn", message);
  }

  fatal(...message: unknown[]) {
    this.logMessage("fatal", message);
    return new Error(message.join(" "));
  }
}
