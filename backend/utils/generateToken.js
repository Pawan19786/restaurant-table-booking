import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      id:   user.id,    // ✅ FIX: "userId" → "id" (auth.middleware.js decoded.id se match karta hai)
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "2h",
    }
  );
};

export default generateToken;