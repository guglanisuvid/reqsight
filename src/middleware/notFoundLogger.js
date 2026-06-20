const logger = require("../logger");

const notFoundLogger = (req, res, next) => {
  if (res?.headersSent) return next();

  (req.logger || logger).warn(
    {
      statusCode: 404,
      code: "PATH_NOT_FOUND",
    },
    "PATH NOT FOUND",
  );

  res.status(404).json({
    success: false,
    message: "Path not found",
    code: "PATH_NOT_FOUND",
    method: req?.method,
    path: req?.path,
    statusCode: res?.statusCode,
  });
};

module.exports = notFoundLogger;
