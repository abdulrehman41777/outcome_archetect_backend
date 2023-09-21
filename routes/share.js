import express from "express";
import post from "../models/post.js";
import instructor from "../models/instructor.js";
import Student from "../models/Student.js";

const router = express.Router();

router.post("/:userID/shared-post/:postID", async (req, res) => {
  try {
    const { userID, postID } = req.params;

    const findPosts = await post.findById(postID);

    if (!findPosts) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    const sharedPost = {
      userID: userID,
      postID: postID,
    };

    // Find the user in any of the three collections
    const findUser =
      (await instructor.findByIdAndUpdate(
        userID,
        { $push: { sharedPosts: sharedPost } },
        { new: true }
      )) ||
      (await Student.findByIdAndUpdate(
        userID,
        { $push: { sharedPosts: sharedPost } },
        { new: true }
      ));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({ sharedPost: findUser.sharedPosts });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/:userID/shared-posts", async (req, res) => {
  try {
    const { userID } = req.params;

    // Find the user by ID in any of the three collections
    const findUser =
      (await instructor.findById(userID)) || (await Student.findById(userID));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const sharedPosts = findUser.sharedPosts;

    // Extract an array of all shared post IDs
    const sharedPostIDs = sharedPosts.map((post) => post.postID);

    // Fetch all the post data for the shared post IDs
    const allPostData = await post.find({ _id: { $in: sharedPostIDs } }).populate({
      path:"authorID",
      model:"instructors",
      select:"username profileImg"
    });

    res.status(200).json({ sharedPosts: allPostData });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post("/:userID/delete-shared/:postID", async (req, res) => {
  try {
    const { userID, postID } = req.params;

    const findUser =
      (await instructor.findById(userID)) || (await Student.findById(userID));

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter the sharedPosts array based on the postID and userID conditions
    const updatedSharedPosts = findUser.sharedPosts.filter(
      (item) =>
        item.postID.toString() !== postID.toString() &&
        item.userID.toString() === userID.toString()
    );

    if (updatedSharedPosts.length === findUser.sharedPosts.length) {
      // No matching item found, return 404
      return res.status(404).json({ message: "Matching post not found" });
    }

    // Update the sharedPosts array of the user with the filtered array
    findUser.sharedPosts = updatedSharedPosts;
    await findUser.save();

    res.status(200).json({ message: "Post Removed From Shared" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;