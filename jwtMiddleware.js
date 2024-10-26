const jwt = require("jsonwebtoken");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;

function jwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized - No token provided",
      status: "failed",
      data: null,
    });
  }

  try {
    const loggedUser = JSON.parse(authHeader);
    const token = loggedUser.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
        status: "failed",
        data: null,
      });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          message: "Forbidden - Invalid token",
          status: "failed",
          data: null,
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({
        message: "Invalid authorization header format",
        status: "failed",
        data: null,
      });
  }
}

module.exports = jwtMiddleware;
