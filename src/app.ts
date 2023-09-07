import config from "../config";
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

const auditLog = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: process.env.LOGGING_FILE_NAME }),
  ],
  level: process.env.LOGGING_LEVEL,
});

const port = process.env.port || 3000;
const app = express();

app.use(helmet());
app.use(logger("dev"));
const rateLimiter = rateLimit({
  windowMs: +process.env.WINDOW_MS || 30 * 60 * 1000,
  max: +process.env.MAX_REQUESTS_PER_IP || 100,
});
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
 * Since attacker could make fake request and bypassing the size limit, it is a good idea to check the data from the request with the content-type. If the performance is a high priority in the case, then you could only check the data with the content-type which is interesting.
 */
app.use(
  urlencoded({ extended: true, limit: process.env.MAX_ALLOW_REQUEST_SIZE })
);
app.use(json({ limit: process.env.MAX_ALLOW_REQUEST_SIZE }));

app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser(process.env.COOKIES_SECRET));

// csrf
const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    cookieName: process.env.CSRF_COOKIE_NAME,
    cookieOptions: {
      samesite: true,
      secure: true,
      httpOnly: true,
      signed: true,
    }, // for testing option only, should be updated for production
  });

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
 * get the csrf token to send to client
 */
app.get("/csrf-token", (req, res) => {
  return res.json({
    token: generateToken(req, res),
  });
});
/**
 * epxample of using the csrf token to protect endpoint
 */
app.post(
  "/protected_endpoint",
  doubleCsrfProtection,
  csrfErrorHandler,
  (req, res) => {
    // should consider using the express-validate to validate the input from user
    // console.log(req.body);
    res.json({
      protected_endpoint: "form processed successfully",
    });
  }
);

/**
 * example of using the captcha
 */
app.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create();
  console.log(captcha.data);

  /**
   * you could store the captcha in the session for later validation (need to install express-session first)
   */
  // req.session.captcha = captcha.text;
  res.type("svg");
  res.status(200).send(captcha.data);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // for any error

  console.log(err.message);
  auditLog.error(err.message);

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(port, () => {
  console.log(`server is running on the port ${port}`);
});
export default app;
