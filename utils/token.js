const jwt = require("jsonwebtoken");

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const isTokenValid = ({ token }) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

const createToken = (user) => {
  const token = createJWT({ payload: user });
  return token;
};

const attachCookiesToResponse = ({ res, user }) => {
  const token = createJWT({ payload: user });
  const threeDays = 1000 * 60 * 60 * 24 * 3;

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + threeDays),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createToken,
};
