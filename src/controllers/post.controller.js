import mongoose from "mongoose";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

const withAuthor = async (posts) => {
  const userIds = [...new Set(posts.map((post) => post.userId))];
  const users = await User.find({ _id: { $in: userIds } }).select("userName");
  const nameById = new Map(users.map((user) => [user._id.toString(), user.userName]));

  return posts.map((post) => ({
    _id: post._id,
    userId: post.userId,
    userName: nameById.get(post.userId) || "Người dùng",
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));
};

export const createPost = async (req, res) => {
  try {
    const { userId, content } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId là bắt buộc" });
    }
    if (!content?.trim()) {
      return res.status(400).json({ message: "content là bắt buộc" });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(404).json({ message: "Người dùng không tồn tại trên hệ thống" });
    }

    const owner = await User.findById(userId);
    if (!owner) {
      return res.status(404).json({ message: "Người dùng không tồn tại trên hệ thống" });
    }
    if (owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Chỉ được tạo bài post cho chính tài khoản đã đăng nhập",
      });
    }

    const now = new Date();
    const post = await Post.create({
      userId: owner._id.toString(),
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({
      message: "Đăng bài thành công",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const data = await withAuthor(posts);
    return res.status(200).json({
      message: "Lấy danh sách bài viết thành công",
      posts: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "content là bắt buộc" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Không tồn tại bài post" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Không tồn tại bài post" });
    }
    if (post.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền cập nhật bài post này" });
    }

    post.content = content.trim();
    await post.save();

    return res.status(200).json({
      message: "Cập nhật bài viết thành công",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Không tồn tại bài post" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Không tồn tại bài post" });
    }
    if (post.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền xóa bài post này" });
    }

    await post.deleteOne();
    return res.status(200).json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};
