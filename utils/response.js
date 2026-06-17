// utils/response.js
exports.success = (res, message, data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

exports.error = (res, message, error = null, status = 500) => {
  return res.status(status).json({
    success: false,
    message,
    error
  });
};
