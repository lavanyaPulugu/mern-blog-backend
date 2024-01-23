const jwt = require("../models/errorModel");

const HttpError = require("../models/errorModel");

const authMiddleware = async (req, res, next) => {
  const Authorizations =
    req.headers.Authorizations || req.header.Authorizations;
  if (Authorizations && Authorizations.startsWith("Bearer")) {
    const token = Authorizations.split("")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
      if (err) {
        return next(new HttpError("Unauthorized. Invalid token.", 403));
      }
      req.user = info;
      next();
    });
  } else {
    return next(new HttpError("unauthorized. no token", 402));
  }
};

module.exports = authMiddleware;
