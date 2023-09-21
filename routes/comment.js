import express from "express";
import post from "../models/post.js";
import admin from "../models/admin.js";
import instructor from "../models/instructor.js";
import Student from "../models/Student.js";
import notifications from "../models/notifications.js";

const router = express.Router();

router.post("/:userID/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    const comment = req.body.comments;
    const userID = req.params.userID; // Assuming userID is passed in the request body

    // Find the user by userID
    const findStudent = await Student.findById(userID);
    const findAdmin = await admin.findById(userID);
    const findInstructor = await instructor.findById(userID);

    let findUser, userType;

    if (findStudent) {
      findUser = findStudent;
      userType = "Student";
    } else if (findAdmin) {
      findUser = findAdmin;
      userType = "Admin";
    } else if (findInstructor) {
      findUser = findInstructor;
      userType = "Instructor";
    } else {
      return res.status(404).json({ message: "User Not Found" });
    }

    if (!comment) {
      return res.status(400).json({ message: "comment field is required" });
    }

    // Prepare comment object to be added
    const commentObj = {
      userID: userID,
      comments: comment,
    };

    const findPost = await post.findByIdAndUpdate(
      postId,
      { $push: { comments: commentObj } },
      { new: true }
    );

    res.status(200).json(findPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.post(
  "/:userID/posts/:postId/comments/:commentId/replies",
  async (req, res) => {
    try {
      const { postId, commentId, userID } = req.params;
      const findStudent = await Student.findById(userID);
      const findAdmin = await admin.findById(userID);
      const findInstructor = await instructor.findById(userID);

      let findUser, userType;

      if (findStudent) {
        findUser = findStudent;
        userType = "Student";
      } else if (findAdmin) {
        findUser = findAdmin;
        userType = "Admin";
      } else if (findInstructor) {
        findUser = findInstructor;
        userType = "Instructor";
      } else {
        res.status(404).json({ message: "User Not Found" });
      }

      // Ensure userType is a string

      const reply = {
        userID: findUser._id,
        comments: req.body.comments,
      };

      const findPost = await post.findOneAndUpdate(
        { _id: postId, "comments._id": commentId },
        { $push: { "comments.$.replies": reply } },
        { new: true }
      );
      res.status(200).json(findPost);
    } catch (error) {
      res.status(500).json({ error: "Failed to add reply" });
      console.log(error);
    }
  }
);

router.delete(
  "/:userID/post/:postID/delete-replies/:commentID/:replyID",
  async (req, res) => {
    try {
      const { userID, commentID, replyID, postID } = req.params;

      const findUser =
        (await Student.findById(userID)) ||
        (await instructor.findById(userID)) ||
        (await admin.findById(userID));

      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const findPost = await post.findById(postID);

      if (!findPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const findComment = await post.findOneAndUpdate(
        { _id: postID, "comments._id": commentID },
        { $pull: { "comments.$.replies": { _id: replyID } } },
        { new: true }
      );

      res.status(200).json(findComment);
    } catch (error) {
      console.log(error);
      res.status(200).json(error);
    }
  }
);

router.delete(
  "/:userID/post/:postID/delete-comments/:commentID",
  async (req, res) => {
    try {
      const { userID, commentID, postID } = req.params;

      const findUser =
        (await Student.findById(userID)) ||
        (await instructor.findById(userID)) ||
        (await admin.findById(userID));

      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const findPost = await post.findById(postID);

      if (!findPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const findComment = await post.findOneAndUpdate(
        { _id: postID, "comments._id": commentID },
        { $pull: { comments: { _id: commentID } } },
        { new: true }
      );

      res.status(200).json(findComment);
    } catch (error) {
      console.log(error);
      res.status(200).json(error);
    }
  }
);

router.get("/all-comments/:postID", async (req, res) => {
  try {
    const { postID } = req.params;

    const findPost = await post.findById(postID);

    if (!findPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    const mergedComments = [];

    for (const comment of findPost.comments) {
      console.log("Processing comment:", comment);

      const user =
        (await instructor.findOne({ _id: comment.userID })) ||
        (await admin.findOne({ _id: comment.userID })) ||
        (await Student.findOne({ _id: comment.userID }));

      if (user) {
        const mergedComment = {
          _id: comment._id,
          userID: user._id,
          username: user.username,
          profileImg: user.profileImg,
          comments: comment.comments,
          replies: [],
        };

        for (const reply of comment.replies) {
          const replyUser =
            (await instructor.findOne({ _id: reply.userID })) ||
            (await Student.findOne({ _id: reply.userID })) ||
            (await admin.findOne({ _id: reply.userID }));
          console.log("User for reply:", replyUser);

          if (replyUser) {
            const replyData = {
              _id: reply._id,
              userID: replyUser._id,
              username: replyUser.username,
              profileImg: replyUser.profileImg,
              comments: reply.comments,
            };
            mergedComment.replies.push(replyData);
          }
        }

        mergedComments.push(mergedComment);
      }
    }
    res.status(200).json(mergedComments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred." });
  }
});

export default router;
