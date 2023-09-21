// index.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./db.js";
import instructor from "./routes/instructor.js";
import student from "./routes/Student.js";
import admin from "./routes/admin.js";
import cors from "cors";
import post from "./routes/post.js";
import fileUpload from "express-fileupload";
import courses from "./routes/courses.js";
import notifications from "./routes/notifications.js";
import review from "./routes/review.js";
import like from "./routes/likes.js";
import comments from "./routes/comment.js";
import event from "./routes/event.js";
import share from "./routes/share.js";
import TempRemover from "./utils/TempRemover.js";
import { SocketManager, ioInstance } from "./socket/SocketManager.js";

dotenv.config();
connectDB();

const app = express();
const port =  process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

const interval = 24 * 60 * 60 * 1000;
setInterval(() => {
  TempRemover();
}, interval);

const server = http.createServer(app);

// Initialize socket.io using the function
const io = SocketManager(server);
app.use((req, res, next) => {
  req.io = io; // Make the io instance available to routes using req.io
  next();
});
app.set("io", ioInstance);
app.use("/api/instructor", instructor);
app.use("/api/student", student);
app.use("/api", admin);
app.use("/api/posts", post);
app.use("/api/courses", courses);
app.use("/api/notifications", notifications);
app.use("/api/reviews", review);
app.use("/api", like);
app.use("/api", comments);
app.use("/api/events", event);
app.use("/api", share);

server.listen(process.env.PORT, () => {
  console.log(`Out Come Architech Listening To PORT ${port}`);
});
