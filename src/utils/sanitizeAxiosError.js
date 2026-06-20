const sanitizeAxiosError = (err) => {
  return {
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
  };
};

module.exports = sanitizeAxiosError;
