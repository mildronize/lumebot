// Copy from https://github.com/mildronize/blog-v8/blob/655a5aeed388c8e8613dd7d6c06339f0b1966eed/snippets/src/utils/logger.ts
// More detail: https://letmutex.com/article/logging-with-pinojs-log-to-file-http-and-even-email

import pino from "pino";
import PinoPretty from "pino-pretty";
import { Logger } from "./logger";

/**
 * Create a pino logger with the given name and level
 *
 * Note: Using pino-pretty in sync mode for development is required to use with stream
 * @ref https://github.com/pinojs/pino-pretty/issues/504
 *
 * @param name
 * @param level - Log level for stdout
 * @returns
 */
export const createPinoLogger = (name: string, level: pino.LevelWithSilentOrString) => {
  return new PinoLogger(pino({
    name,
    // Set the global log level to the lowest level
    // We adjust the level per transport
    level: 'trace',
    hooks: {},
    serializers: {
      // Handle error properties as Error and serialize them correctly
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      validationErrors: pino.stdSerializers.err,
    },
  }, pino.multistream([
    {
      level,
      stream: PinoPretty({
        // Sync log should not be used in production
        sync: true,
        colorize: true,
      })
    },
    // {
    //   level: 'info',
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //   stream: pino.transport({
    //     target: './app.log'
    //   })
    // },
    // {
    //   level: "debug",
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //   stream: pino.transport({
    //     target: 'pino-opentelemetry-transport',
    //   })
    // }
  ])));
}


// ----------------------------
// pino logger
// ----------------------------

export class PinoLogger implements Logger {
  constructor(private logger: pino.Logger) { }

  info(...messages: string[]) {
    this.logger.info(messages.join(" "));
  }
  debug(...messages: string[]) {
    this.logger.debug(messages.join(" "));
  }
  error(...messages: string[]) {
    this.logger.error(messages.join(" "));
  }
  warn(...messages: string[]) {
    this.logger.warn(messages);
  }
  fatal(...messages: string[]) {
    this.logger.fatal(messages.join(" "));
    return new Error(messages.join(" "));
  }
}
