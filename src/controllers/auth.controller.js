import crypto from "node:crypto";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";

const buildApiKey = (userId, email) => {
  const randomstring = crypto.randomUUID();
  return `mern-$${userId}$-$${email}$-$${randomstring}$`;
};

export const register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName?.trim()) {
      return res.status(400).json({ message: "userName là bắt buộc" });
    }
    if (!email?.trim()) {
      return res.status(400).json({ message: "email là bắt buộc" });
    }
    if (!password) {
      return res.status(400).json({ message: "password là bắt buộc" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      userName: userName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: "email là bắt buộc" });
    }
    if (!password) {
      return res.status(400).json({ message: "password là bắt buộc" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    const apiKey = buildApiKey(user._id.toString(), user.email);
    user.apiKey = apiKey;
    await user.save();

    return res.status(200).json({
      message: "Đăng nhập thành công",
      apiKey,
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};
