import mongoose from "mongoose";
import User from "../models/user.model.js";

export const checkApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.query;
    if (!apiKey) {
      return res.status(401).json({ message: "Không có apiKey" });
    }

    const matched = /^mern-\$([^$]+)\$-\$([^$]+)\$-\$([^$]+)\$$/.exec(apiKey);
    if (!matched) {
      return res.status(401).json({ message: "apiKey không xác thực được" });
    }

    const [, userId, email, randomstring] = matched;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: "apiKey không xác thực được" });
    }

    const user = await User.findById(userId);
    if (!user || user.email !== email || user.randomstring !== randomstring) {
      return res.status(401).json({ message: "apiKey không xác thực được" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};
