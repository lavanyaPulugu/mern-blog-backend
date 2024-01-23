//unsupported (404) routes
const notFound = (req, res, next) => {
  const error = new Error(`not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

//middleware to handle errors
const errorHandler = (err, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res
    .status(err.code || 500)
    .json({ message: err.message || "An unknow error occured" });
};

module.exports = { notFound, errorHandler };
