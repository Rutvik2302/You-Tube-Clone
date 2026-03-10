const asyncHandler = (requvestHandler) => {
  (req, res, next) => {
    Promise.resolve(requvestHandler(req, res, next)).catch((err) => next(err));
  };
};

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// module.exports = asyncHandler;
