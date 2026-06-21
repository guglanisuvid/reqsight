const config = require("../config");

const buildSanitizeAxiosError = (sanitize) => {
  if (typeof sanitize === "function") return sanitize;

  if (sanitize !== null && typeof sanitize === "object") {
    const snapshot = { ...sanitize };
    return () => snapshot;
  }

  return (err) => ({ ...err });
};

const sanitizeAxiosError = buildSanitizeAxiosError(config.sanitize.axiosErrors);

module.exports = sanitizeAxiosError;
