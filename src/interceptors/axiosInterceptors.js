"use strict";

const logger = require("../logger");

let registered = false;

const axiosInterceptors = () => {
  if (registered) return;

  let axios;

  try {
    axios = require("axios");
  } catch {
    console.warn(
      "[reqsight] axios not found. " +
        "Install axios to enable outbound HTTP interception: " +
        "npm install axios",
    );
    return;
  }

  registered = true;

  axios.interceptors.request.use(
    (config) => {
      if (!config?.headers?.["x-correlation-id"])
        logger.warn(
          { method: config?.method, url: config?.url, type: "OUTBOUND" },
          "x-correlation-id not set for outbound request",
        );

      config["startTime"] = Date.now();

      logger.info(
        {
          correlationId: config?.headers?.["x-correlation-id"],
          method: config?.method,
          url: config?.url,
          params: config?.params,
          data: config?.data,
          startTime: config["startTime"],
          type: "OUTBOUND",
        },
        config.headers["x-correlation-id"]
          ? `[${config.headers["x-correlation-id"]}] - OUTBOUND REQUEST`
          : "OUTBOUND REQUEST",
      );
      return config;
    },
    (err) => Promise.reject(err),
  );

  axios.interceptors.response.use(
    (response) => {
      // logger.info(
      //   {
      //     correlationId: response?.config?.headers?.["x-correlation-id"],
      //     method: response?.config?.method,
      //     path: response?.config?.url,
      //     ...responseSerializer(
      //       response,
      //       response?.data,
      //       Date.now() - response?.config?.startTime,
      //     ),
      //     type: "OUTBOUND",
      //   },
      //   response?.config?.headers?.["x-correlation-id"]
      //     ? `[${response?.config?.headers["x-correlation-id"]}] - OUTBOUND RESPONSE`
      //     : "OUTBOUND RESPONSE",
      // );

      return response;
    },

    (err) => {
      logger.error(
        {
          correlationId: err?.config?.headers?.["x-correlation-id"],
          method: err?.config?.method,
          url: err?.config?.url,
          params: err?.config?.params,
          body: err?.config?.data,
          contentType: err?.config?.headers?.["content-type"],
          type: "OUTBOUND",
          ...(err?.isAxiosError && { isAxiosError: true }),
          error: err?.isAxiosError ? err?.response?.data : err,
        },
        err?.config?.headers?.["x-correlation-id"]
          ? `[${err?.config?.headers["x-correlation-id"]}] - OUTBOUND ERROR`
          : "OUTBOUND ERROR",
      );

      return Promise.reject(err);
    },
  );
};

module.exports = axiosInterceptors;
