const throwError = (msg, statusCode, arg = {}) => {
  const errorObject = {
    statusCode: typeof statusCode === "number" ? statusCode : 500,
    isOperational: true,
  };

  if (arg && typeof arg === "object") Object.assign(errorObject, arg);

  throw Object.assign(
    new Error(typeof msg === "string" ? msg : "Something went wrong"),
    errorObject,
  );
};

module.exports = throwError;
