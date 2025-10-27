export const notFound = (req, res) =>
  res.status(404).json({ message: "Route not found" });

export const errorHandler = (err, req, res, next) => {
  console.error("GLOBAL_ERROR:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};
