import express from "express";
import post from "../models/post.js";
import admin from "../models/admin.js";
import instructor from "../models/instructor.js";
import Student from "../models/Student.js";

const router = express.Router();

router.post("/:userID/like/:postID", async (req, res) => {
  try {
    const { postID, userID } = req.params;

    const findPost = await post.findById(postID);
    const findUser =
      (await admin.findById(userID)) ||
      (await instructor.findById(userID)) ||
      (await Student.findById(userID));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    if (!findPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    const userExists = findUser._id;

    // Check if the user ID is already in the likes array
    const userIndex = findPost.likes.findIndex((like) =>
      like._id.equals(userExists)
    );

    if (userIndex !== -1) {
      // If the user ID is in the likes array, remove it.
      findPost.likes.splice(userIndex, 1);
    } else {
      // If the user ID is not in the likes array, add it with user details.
      findPost.likes.push({
        _id: userExists,
        userName: findUser.username,
        profileImg: findUser.profileImg,
      });
    }

    const saveRes = await findPost.save();

    res.status(200).json({ message: "Liked", likes: saveRes.likes });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
