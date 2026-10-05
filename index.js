import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRouter from "./src/routes/user.route.js";
import postRouter from "./src/routes/post.route.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

mongoose
  .connect(process.env.URI_MONGO)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", userRouter);
app.use("/posts", postRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
