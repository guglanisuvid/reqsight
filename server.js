// test-app/server.js
const express = require("express");
const {
  requestLogger,
  errorLogger,
  notFoundLogger,
  throwError,
  axiosInterceptors,
} = require("./index");

axiosInterceptors();

const app = express();
app.use(express.json());

app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Server up and running at port 3000" });
});

app.get("/test", (req, res) => {
  res.json({ success: true, message: "working" });
});

app.get("/error", (req, res) => {
  throwError("Test error", 400, { code: "TEST_ERROR" });
});

app.get("/crash", (req, res) => {
  throw new Error("Unexpected crash");
});

const axios = require("axios");
app.get("/axios", async (req, res, next) => {
  try {
    await axios.get("http://localhost:3000/test?test=1", {
      params: {
        test: 1,
      },
      data: {
        test: 1,
      },
      headers: {
        "x-correlation-id": req.correlationId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use(notFoundLogger);
app.use(errorLogger);

app.listen(3000, () => console.log("test app running on 3000"));
