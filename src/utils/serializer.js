const requestSerializer = (req) => ({
  params: req?.params,
  query: req?.query,
  body: req?.body,
  startTime: req?.startTime,
  originalUrl: req?.originalUrl,
  ip: req?.ip,
  accept: req?.headers?.["accept"],
  "accept-language": req?.headers?.["accept-language"],
  "user-agent": req?.headers?.["user-agent"],
  origin: req?.headers?.["origin"],
  referer: req?.headers?.["referer"],
});

const responseSerializer = (res, data, duration) => ({
  statusCode: res?.statusCode,
  duration: `${duration}ms`,
  endTime: Date.now(),
  responseSize: data
    ? `${Buffer.byteLength(
        typeof data === "string" ? data : JSON.stringify(data),
        "utf8",
      )} bytes`
    : "0 bytes",
  "content-type": res?.getHeader?.("content-type"),
  "content-length": res?.getHeader?.("content-length"),
  "x-correlation-id": res?.getHeader?.("x-correlation-id"),
  "access-control-allow-origin": res?.getHeader?.(
    "access-control-allow-origin",
  ),
});

module.exports = {
  requestSerializer,
  responseSerializer,
};
