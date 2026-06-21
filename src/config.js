const config = {
  /*
   * logLevel
   * Controls the minimum log level emitted by reqsight.
   *
   * Possible values: "fatal" | "error" | "warn" | "info" | "debug" | "trace"
   *
   * Examples:
   *   logLevel: "info"   // logs info, warn, error, fatal (default)
   *   logLevel: "warn"   // only logs warn and above — less noise in production
   *   logLevel: "debug"  // verbose output for local development
   */
  logLevel: process.env.LOG_LEVEL || "info",

  sanitize: {
    /*
     * sanitize.request
     * Controls what gets logged from incoming request objects.
     *
     * Possible values:
     *   function  — called on every request with (req). Return any object.
     *               Edit the default below to add, remove, or rename fields.
     *   object    — a static shape with no dynamic values. Snapshotted once at startup.
     *               Use for fixed metadata like service name or environment.
     *               Example: { service: "my-api", env: process.env.NODE_ENV }
     *   any other — spreads the full raw req object. May expose sensitive data.
     */
    request: (req) => ({
      ip: req?.ip,
      method: req?.method,
      originalUrl: req?.originalUrl,
      params: req?.params,
      query: req?.query,
      body: req?.body,
      startTime: req?.startTime,
      accept: req?.headers?.["accept"],
      "accept-language": req?.headers?.["accept-language"],
      "user-agent": req?.headers?.["user-agent"],
      origin: req?.headers?.["origin"],
      referer: req?.headers?.["referer"],
    }),

    /*
     * sanitize.response
     * Controls what gets logged from outgoing response objects.
     * Compatible with both Express res and axios response shapes.
     *
     * Possible values:
     *   function  — called on every response with (res). Return any object.
     *               Duration and responseSize are calculated separately in the middleware.
     *               Edit the default below to add, remove, or rename fields.
     *   object    — a static shape with no dynamic values. Snapshotted once at startup.
     *               Example: { service: "my-api", env: process.env.NODE_ENV }
     *   any other — logs statusCode, duration, responseSize, and full headers object.
     */
    response: (res) => ({
      statusCode: res?.statusCode || res?.status,
      "content-type":
        res?.getHeader?.("content-type") || res?.headers?.["content-type"],
      "content-length":
        res?.getHeader?.("content-length") || res?.headers?.["content-length"],
      "x-correlation-id":
        res?.getHeader?.("x-correlation-id") ||
        res?.headers?.["x-correlation-id"],
      "access-control-allow-origin":
        res?.getHeader?.("access-control-allow-origin") ||
        res?.headers?.["access-control-allow-origin"],
    }),

    /*
     * sanitize.axiosErrors
     * Controls what gets logged when an outbound axios request fails.
     *
     * Possible values:
     *   function  — called on every axios error with (err). Return any object.
     *               Edit the default below to add, remove, or rename fields.
     *               Sensitive headers like Authorization and Cookie are excluded by default.
     *   object    — a static shape with no dynamic values. Snapshotted once at startup.
     *               Example: { service: "my-api", env: process.env.NODE_ENV }
     *   any other — spreads the full axios error. Includes raw config with all headers.
     *               Only use if you fully trust and control your log destination.
     */
    axiosErrors: (err) => ({
      code: err?.code,
      message: err?.message,
      name: err?.name,
      statusCode: err?.status,
      isRequestMade: !!err?.request,
      config: {
        url: err?.config?.url,
        method: err?.config?.method,
        accept: err?.config?.headers?.["accept"],
        "accept-language": err?.config?.headers?.["accept-language"],
        "user-agent": err?.config?.headers?.["user-agent"],
        origin: err?.config?.headers?.["origin"],
        referer: err?.config?.headers?.["referer"],
      },
      response: {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        headers: {
          "content-type": err?.response?.headers?.["content-type"],
          "content-length": err?.response?.headers?.["content-length"],
          "x-correlation-id": err?.response?.headers?.["x-correlation-id"],
          "access-control-allow-origin":
            err?.response?.headers?.["access-control-allow-origin"],
        },
        data: err?.response?.data,
      },
      stack: err?.stack,
    }),
  },

  /*
   * stackTrace
   * Whether to include the error stack trace in error responses sent to the client.
   * Never expose stack traces in production — they reveal internal paths and logic.
   *
   * Possible values: true | false
   *
   * Examples:
   *   stackTrace: true                                   // always include (dev only)
   *   stackTrace: false                                  // never include
   *   stackTrace: process.env.NODE_ENV !== "production"  // only outside prod (default)
   */
  stackTrace: process.env.NODE_ENV !== "production" || false,

  /*
   * prettyLogs
   * Whether to use pino-pretty for colorized, human-readable console output.
   * Requires pino-pretty to be installed (optional dependency).
   * Disable in production — raw JSON is faster and works with log aggregators
   * (Datadog, CloudWatch, Loki, etc.).
   *
   * Possible values: true | false
   *
   * Examples:
   *   prettyLogs: true                                   // colorized output (dev only)
   *   prettyLogs: false                                  // raw JSON
   *   prettyLogs: process.env.NODE_ENV !== "production"  // only outside prod (default)
   */
  prettyLogs: process.env.NODE_ENV !== "production" || false,
};

module.exports = config;
