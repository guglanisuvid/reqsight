const { generateCorrelationId } = require("../utils/correlationId");
const logger = require("../logger");
const {
  requestSerializer,
  responseSerializer,
} = require("../utils/serializer");

const requestLogger = (req, res, next) => {
  req.correlationId =
    req.headers["x-correlation-id"] || generateCorrelationId();

  res.setHeader("x-correlation-id", req.correlationId);

  req.startTime = Date.now();

  req.logger = logger.withRequest(req.correlationId, req.method, req.path);

  req.logger.info(
    { ...requestSerializer(req) },
    `[${req.correlationId}] - REQUEST RECEIVED`,
  );

  let responseSent = false;

  const logResponse = (data) => {
    if (responseSent || !data) return;

    responseSent = true;

    const endTime = Date.now();

    req.logger.info(
      {
        ...requestSerializer(req),
        ...responseSerializer(res),
        duration: `${endTime - req.startTime}ms`,
        endTime,
        responseSize: data
          ? `${Buffer.byteLength(
              typeof data === "string" ? data : JSON.stringify(data),
              "utf8",
            )} bytes`
          : "0 bytes",
      },
      `[${req.correlationId}] - REQUEST COMPLETED`,
    );
  };

  const originalEnd = res.end;
  const originalSend = res.send;

  res.end = function (data, encoding) {
    logResponse(data);
    return originalEnd.call(this, data, encoding);
  };

  res.send = function (data) {
    logResponse(data);
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
