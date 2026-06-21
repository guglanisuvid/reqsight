const pino = require("pino");
const config = require("../config");

const redact = {
  paths: [],
  censor: "[REDACTED]",
};

const serializers = {
  err: pino.stdSerializers.err,
  error: pino.stdSerializers.err,
};

const loggerOptions = {
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers,
  redact,
  base: undefined,
};

// Logger configuration
const log = config.prettyLogs
  ? pino(
      loggerOptions,
      pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }),
    )
  : pino(loggerOptions);

log.withRequest = (correlationId, method, path) => {
  return log.child({
    correlationId,
    method,
    path,
  });
};

module.exports = log;
