import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
  },
});

const User = mongoose.model("user", userSchema, "user");

export default User;
