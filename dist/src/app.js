import config from "../config.js";
import express, { urlencoded, json } from "express";
import logger from "morgan";
import winston from "winston";
import rateLimit from "express-rate-limit";
const log = new winston.Logger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: config.loggingFileName }),
    ],
    level: config.loggingLevel,
});
const port = 3000;
const app = express();
app.use(logger("dev"));
// Since attacker could make fake request and bypassing the size limit, it is a good idea to check the data from the request with the content-type. If the performance is a high priority in the case, then you could only check the data with the content-type which is interesting.
app.use(urlencoded({ extended: true, limit: config.maxAllowedRequestSize }));
app.use(json({ limit: config.maxAllowedRequestSize }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));
const rateLimiter = rateLimit({
    windowMs: config.windowMs,
    max: config.maxRequestPerIp,
});
// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });
// error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};
//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });
app.listen(port, () => {
    console.log(`server is running on the port ${port}`);
});
export default app;
//# sourceMappingURL=app.js.map