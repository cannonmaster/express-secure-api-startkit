import dotenv from "dotenv";
import { doubleCsrf } from "csrf-csrf";
import createError from "http-errors";
import express, { urlencoded, json } from "express";
import cors from "cors";
import xss from "xss-clean";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import winston from "winston";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import hpp from "hpp";
import toobusy from "toobusy-js";
import "express-async-errors";
import svgCaptcha from "svg-captcha";
import logger from "morgan";
// import nocache from "nocache";
// import escapeHtml from "escape-html";
// import crypto from "crypto";
// import mime from "mime-type";
// import { exec } from "child_process";
// import getRawBody from "raw-body";

dotenv.config();

/**
 * Winston Logger for audit logging
 * @type {winston.Logger}
 */
const auditLog = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: process.env.LOGGING_FILE_NAME }),
  ],
  level: process.env.LOGGING_LEVEL,
});

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

app.use(helmet());
app.use(logger("dev"));

/**
 * Rate limiter middleware to limit requests
 * @type {express.RequestHandler}
 */
const rateLimiter = rateLimit({
  windowMs: +process.env.WINDOW_MS || 30 * 60 * 1000,
  max: +process.env.MAX_REQUESTS_PER_IP || 100,
});

/**
 * Slow down middleware to prevent abuse
 * @type {express.RequestHandler}
 */
const speedLimit = slowDown({
  windowMs: process.env.WINDOW_MS,
  delayAfter: process.env.DELAY_AFTER || 10,
  delayMs: process.env.DELAY_MS || 500,
});

app.use(rateLimiter, speedLimit);

app.use((req, res, next) => {
  if (toobusy()) {
    res.status(503).send("Server too busy");
  } else {
    next();
  }
});

app.use(cors());
app.use(xss());
app.use(hpp());

/**
 * Body parser middleware for URL-encoded data
 * @type {express.RequestHandler}
 */
app.use(
  urlencoded({ extended: true, limit: process.env.MAX_ALLOW_REQUEST_SIZE })
);

/**
 * Body parser middleware for JSON data
 * @type {express.RequestHandler}
 */
app.use(json({ limit: process.env.MAX_ALLOW_REQUEST_SIZE }));

app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser(process.env.COOKIES_SECRET));

// CSRF protection
const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    cookieName: process.env.CSRF_COOKIE_NAME,
    cookieOptions: {
      samesite: true,
      secure: true,
      httpOnly: true,
      signed: true,
    },
  });

/**
 * CSRF error handler middleware
 * @type {express.RequestHandler}
 */
const csrfErrorHandler = (error, req, res, next) => {
  if (error == invalidCsrfTokenError) {
    res.status(403).json({
      error: "csrf validation error",
    });
  } else {
    next();
  }
};

/**
 * Get the CSRF token to send to the client
 * @function
 * @name GET/csrf-token
 * @memberof module:app
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} - JSON response with the CSRF token
 */
app.get("/csrf-token", (req, res) => {
  return res.json({
    token: generateToken(req, res),
  });
});

/**
 * Example of using the CSRF token to protect an endpoint
 * @function
 * @name POST/protected_endpoint
 * @memberof module:app
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
app.post(
  "/protected_endpoint",
  doubleCsrfProtection,
  csrfErrorHandler,
  (req, res) => {
    // Should consider using the express-validate to validate the input from the user
    res.json({
      protected_endpoint: "form processed successfully",
    });
  }
);

/**
 * Example of using a CAPTCHA
 * @function
 * @name GET/captcha
 * @memberof module:app
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
app.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create();
  console.log(captcha.data);

  /**
   * You could store the CAPTCHA in the session for later validation
   * (need to install express-session first)
   */
  // req.session.captcha = captcha.text;
  res.type("svg");
  res.status(200).send(captcha.data);
});

/**
 * Catch 404 and forward to error handler
 * @function
 * @memberof module:app
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 */
app.use(function (req, res, next) {
  next(createError(404));
});

/**
 * Error handler
 * @function
 * @memberof module:app
 * @param {Error} err - The error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 */
app.use(function (err, req, res, next) {
  console.log(err.message);
  auditLog.error(err.message);

  res.status(err.status || 500);
  res.send(err.message);
});

/**
 * Start the Express server
 */
app.listen(process.env.port || 3000, () => {
  console.log(`Server is running on the port ${process.env.port || 3000}`);
});

/**
 * Export the Express application
 * @exports app
 */
export default app;
