function adminMiddleware(req, res, next) {
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
    const role = loggedUser.role;

    if (!role) {
      return res.status(401).json({
        message: "Unauthorized - No role provided",
        status: "failed",
        data: null,
      });
    }
    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden - Invalid role",
        status: "failed",
        data: null,
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Invalid authorization header format",
      status: "failed",
      data: null,
    });
  }
}

module.exports = adminMiddleware;
