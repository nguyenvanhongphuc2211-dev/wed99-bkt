import { Router } from "express";
import {
  createPost,
  deletePost,
  getPosts,
  updatePost,
} from "../controllers/post.controller.js";
import { checkApiKey } from "../middlewares/user.middleware.js";

const postRouter = Router();

postRouter.get("/", getPosts);
postRouter.post("/", checkApiKey, createPost);
postRouter.put("/:id", checkApiKey, updatePost);
postRouter.patch("/:id", checkApiKey, updatePost);
postRouter.delete("/:id", checkApiKey, deletePost);

export default postRouter;
