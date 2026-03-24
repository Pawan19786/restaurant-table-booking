import User from "../models/User.model.js";
import { isValidEmail, isStrongPassword } from "../utils/email_validator.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper: build user response object ──────────────────────────
const buildUserResponse = (user) => ({
  id:          user._id,
  name:        user.name,
  email:       user.email,
  role:        user.role,
  picture:     user.picture || null,   // ✅ picture included
  isGoogleUser: user.isGoogleUser,
});

// ─────────────────────────────────────────────
// 1. REGISTER
// ─────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail))
      return res.status(400).json({ message: "Invalid email format" });

    if (!isStrongPassword(password))
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists)
      return res.status(409).json({ message: "User already exists" });

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role:    "user",
      picture: null,       // email register pe picture nahi hoti
    });

    const token = generateToken({ id: newUser._id.toString(), role: newUser.role });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. LOGIN
// ─────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.isGoogleUser)
      return res.status(400).json({
        message: "This account uses Google Sign-In. Please login with Google.",
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user._id.toString(), role: user.role });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 3. GOOGLE AUTH  ← picture yahan se aati hai
// ─────────────────────────────────────────────
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential)
      return res.status(400).json({ message: "Google credential is required" });

    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload)
      return res.status(400).json({ message: "Invalid Google token" });

    const {
      email,
      name,
      sub:     googleId,
      picture,           // ✅ Google profile photo URL
      email_verified,
    } = payload;

    if (!email || !email_verified)
      return res.status(400).json({ message: "Google account email not verified" });

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Existing email user — Google se link karo + picture update karo
        user.googleId    = googleId;
        user.isGoogleUser = true;
        if (picture) user.picture = picture;   // ✅ picture update
        await user.save({ validateBeforeSave: false });
      } else {
        // Brand new user
        user = await User.create({
          name:         name || "Google User",
          email:        normalizedEmail,
          googleId,
          isGoogleUser: true,
          picture:      picture || null,        // ✅ Google photo save
          password:     crypto.randomBytes(32).toString("hex"),
          role:         "user",
        });
      }
    } else {
      // Existing Google user — picture update karo agar change hui ho
      if (picture && user.picture !== picture) {
        user.picture = picture;
        await user.save({ validateBeforeSave: false });
      }
    }

    const token = generateToken({ id: user._id.toString(), role: user.role });

    return res.status(200).json({
      message: "Google authentication successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      message: "Google authentication failed",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 4. FORGOT PASSWORD
// ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user)
      return res.status(200).json({ message: "If this email exists, a reset link has been sent." });

    if (user.isGoogleUser)
      return res.status(400).json({
        message: "This account uses Google Sign-In. Password reset is not available.",
      });

    const resetToken   = crypto.randomBytes(32).toString("hex");
    const hashedToken  = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken  = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"TableTime" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: "Reset your TableTime password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>Click below to reset your password. Link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7030d0;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#888;font-size:13px;">
            If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 5. RESET PASSWORD
// ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "New password is required" });

    if (!isStrongPassword(password))
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};