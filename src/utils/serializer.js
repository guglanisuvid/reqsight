const config = require("../config");

const buildSerializer = (sanitize) => {
  if (typeof sanitize === "function") return sanitize;

  if (sanitize !== null && typeof sanitize === "object") {
    const snapshot = { ...sanitize };
    return () => snapshot;
  }

  return (target) => ({ ...target });
};

const requestSerializer = buildSerializer(config.sanitize.request);
const responseSerializer = buildSerializer(config.sanitize.response);

module.exports = {
  requestSerializer,
  responseSerializer,
};
