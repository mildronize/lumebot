
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface Logger {
  info(...messages: unknown[]): void;
  debug(...messages: unknown[]): void;
  error(...messages: unknown[]): void;
  warn(...messages: unknown[]): void;
  fatal(...messages: unknown[]): Error | void;
}
