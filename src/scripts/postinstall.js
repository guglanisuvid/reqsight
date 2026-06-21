// 'use strict'

// const fs   = require('fs')
// const path = require('path')

// // where to create the config — user's project root
// const configPath = path.join(process.cwd(), 'reqsight.config.js')

// // don't overwrite if already exists
// if (fs.existsSync(configPath)) {
//   console.log('[reqsight] Config file already exists — skipping creation.')
//   process.exit(0)
// }

// const defaultConfig = `
// 'use strict'

// const config = {
//   /*
//    * logLevel
//    * Controls the minimum log level emitted by reqsight.
//    *
//    * Possible values: "fatal" | "error" | "warn" | "info" | "debug" | "trace"
//    */
//   logLevel: process.env.LOG_LEVEL || "info",

//   sanitize: {
//     /*
//      * sanitize.request
//      * Controls what gets logged from incoming request objects.
//      */
//     request: (req) => ({
//       ip:          req?.ip,
//       method:      req?.method,
//       originalUrl: req?.originalUrl,
//       params:      req?.params,
//       query:       req?.query,
//       body:        req?.body,
//       "user-agent": req?.headers?.["user-agent"],
//       origin:      req?.headers?.["origin"],
//       referer:     req?.headers?.["referer"],
//     }),

//     /*
//      * sanitize.response
//      * Controls what gets logged from outgoing response objects.
//      */
//     response: (res) => ({
//       statusCode: res?.statusCode || res?.status,
//       "content-type":
//         res?.getHeader?.("content-type") || res?.headers?.["content-type"],
//       "content-length":
//         res?.getHeader?.("content-length") || res?.headers?.["content-length"],
//       "x-correlation-id":
//         res?.getHeader?.("x-correlation-id") ||
//         res?.headers?.["x-correlation-id"],
//     }),

//     /*
//      * sanitize.axiosErrors
//      * Controls what gets logged when an outbound axios request fails.
//      */
//     axiosErrors: (err) => ({
//       code:          err?.code,
//       message:       err?.message,
//       name:          err?.name,
//       isRequestMade: !!err?.request,
//       config: {
//         url:    err?.config?.url,
//         method: err?.config?.method,
//       },
//       response: {
//         status:     err?.response?.status,
//         statusText: err?.response?.statusText,
//         data:       err?.response?.data,
//       },
//       stack: err?.stack,
//     }),
//   },

//   /*
//    * stackTrace
//    * Whether to include stack trace in error logs.
//    * Never expose in production.
//    */
//   stackTrace: process.env.NODE_ENV !== "production",

//   /*
//    * prettyLogs
//    * Colorized human-readable logs for development.
//    * Disable in production.
//    */
//   prettyLogs: process.env.NODE_ENV !== "production",
// }

// module.exports = config;
// `

// try {
//   fs.writeFileSync(configPath, defaultConfig, 'utf8')
//   console.log('[reqsight] Config file created → reqsight.config.js')
//   console.log('[reqsight] Customize it to control what gets logged.')
// } catch(err) {
//   // silently fail — don't break the install
//   console.warn('[reqsight] Could not create config file:', err.message)
// }