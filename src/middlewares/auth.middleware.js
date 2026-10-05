import User from "../models/user.model.js";

export const checkApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.query;
    if (!apiKey) {
      return res.status(401).json({ message: "Không có apiKey" });
    }

    const user = await User.findOne({ apiKey });
    if (!user) {
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
