const config = require("../config");
const logger = require("../logger");
const sanitizeAxiosError = require("../utils/sanitizeAxiosError");

const errorLogger = (err, req, res, _next) => {
  (req.logger || logger).error(
    {
      ...(err?.isAxiosError && { isAxiosError: true }),
      error: err?.isAxiosError ? sanitizeAxiosError(err) : err,
    },
    req.correlationId
      ? `[${req.correlationId}] - REQUEST ERROR`
      : "REQUEST ERROR",
  );

  if (err?.isAxiosError && err?.response) {
    const { status, data } = err.response;
    return res.status(status || 500).json({
      success: false,
      message: data?.message || "Downstream service error",
      ...(typeof data === "object" ? data : {}),
    });
  }

  if (!err?.isOperational)
    return res.status(500).json({
      success: false,
      message: `Even the best systems have bad days. Ours is having one right now.${req?.correlationId ? ` Reference: ${req.correlationId}` : ""}`,
    });

  const errorResponse = { success: false, message: err?.message };
  Object.keys(err).forEach((key) => {
    if (key === "stack" || key === "isOperational") return;

    const value = err[key];

    if (Array.isArray(value)) {
      errorResponse[key] = value;
      return;
    }

    if (value !== null && typeof value !== "object") {
      errorResponse[key] = value;
    }
  });

  // Include stack trace only in development
  if (config.stackTrace) {
    errorResponse.stack = err?.stack;
  }

  res.status(err.statusCode || 500).json(errorResponse);
};

module.exports = errorLogger;
