import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from "express";
import { Logger } from "pino";

declare module "express" {
  interface Request {
    correlationId?: string;
    startTime?: number;
    logger?: Logger;
  }
}

/**
 * Middleware that logs incoming requests and outgoing responses.
 * Attaches `req.correlationId`, `req.logger`, and `req.startTime` to every request.
 * Reads `x-correlation-id` from incoming headers or generates a new UUID.
 */
export declare const requestLogger: RequestHandler;

/**
 * Error-handling middleware that logs errors and sends a structured JSON response.
 * Distinguishes between operational errors (safe to expose) and unexpected crashes.
 * Must be registered after all routes.
 */
export declare const errorLogger: ErrorRequestHandler;

/**
 * Catch-all middleware that handles unmatched routes.
 * Logs a 404 warning and responds with a structured JSON error.
 * Must be registered after all routes and before `errorLogger`.
 */
export declare const notFoundLogger: RequestHandler;

/**
 * Throws an operational error with a status code and optional extra properties.
 * Errors thrown this way are treated as safe to expose to the client by `errorLogger`.
 *
 * @param message - Error message returned to the client
 * @param statusCode - HTTP status code (defaults to 500)
 * @param extra - Additional properties merged into the error response
 */
export declare function throwError(
  message: string,
  statusCode?: number,
  extra?: Record<string, unknown>
): never;

/**
 * Registers request and response interceptors on the global axios instance.
 * Logs all outbound HTTP requests with correlation ID propagation.
 * Safe to call multiple times — interceptors are only registered once.
 * Requires `axios` to be installed separately.
 */
export declare function axiosInterceptors(): void;
