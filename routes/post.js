import express, { response } from "express";
import post from "../models/post.js";
import { v2 as cloudinary } from "cloudinary";
import student from "../models/Student.js";
import instructor from "../models/instructor.js";
import admin from "../models/admin.js";
import notifications from "../models/notifications.js";

const router = express.Router();

cloudinary.config({
  cloud_name: "dnsaxzqz8",
  api_key: "567833932974999",
  api_secret: "dQT4OyDnZZsWWjsCDqUHbEEDedg",
});

router.get("/instructor-posts/:instructorID", async (req, res) => {
  try {
    const { instructorID } = req.params;
    const findInstructor = await instructor.findById(instructorID);

    if (!findInstructor) {
      return res.status(404).json({ message: "Not Found" });
    }
    const findPosts = await post
      .find({
        authorID: findInstructor._id,
      })
      .sort({ createdAt: -1 })
      .populate({
        path: "authorID",
        model: "instructors",
        select: "username profileImg",
      });

    res.status(200).json({ posts: findPosts });
  } catch (error) {
    console.log(error);
  }
});

router.get("/:postID/single-post", async (req, res) => {
  try {
    const { postID } = req.params;

    const findPost = await post.findById(postID);

    const findUser =
      (await student.findById(findPost.authorID)) ||
      (await admin.findById(findPost.authorID)) ||
      (await instructor.findById(findPost.authorID));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    if (!findPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    const singlePost = {
      ...findPost._doc,
      author: {
        username: findUser.username,
        profileImg: findUser.profileImg,
      },
    };

    res.status(200).json(singlePost);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post("/:userID/create-post", async (req, res) => {
  try {
    const { userID } = req.params;

    const findStudent = await student.findById(userID);
    const findInstructor = await instructor.findById(userID);
    const findAdmin = await admin.findById(userID);

    const images = req.files && req.files.imageUrls;
    const videoUrls = req.files && req.files.videoUrls;

    const uploadUrl = videoUrls
      ? await cloudinary.uploader.upload(videoUrls.tempFilePath, {
          resource_type: "video",
          folder: "videos",
        })
      : undefined;

    let userExist;

    if (findStudent) {
      userExist = findStudent;
    } else if (findInstructor) {
      userExist = findInstructor;
    } else if (findAdmin) {
      userExist = findAdmin;
    } else {
      res.status(404).json({ message: "User With This Email Not Found" });
      return;
    }

    if (images && req.body.content && !videoUrls) {
      const imageUrls = [];
      if (Array.isArray(images)) {
        // Handle multiple file uploads
        for (const image of images) {
          const uploadResult = await cloudinary.uploader.upload(
            image?.tempFilePath
          );
          imageUrls.push(uploadResult.secure_url);
        }
      } else if (images) {
        // Handle single file upload
        const uploadResult = await cloudinary.uploader.upload(
          images?.tempFilePath
        );
        imageUrls.push(uploadResult.secure_url);
      }

      const createPost = new post({
        authorID: userExist._id,
        imageUrls,
        content: req.body.content,
      });
      const savePost = await createPost.save();
      res.status(200).json({ savePost, message: "Image Post" });
    } else if (videoUrls && req.body.content && !images) {
      const createPost = new post({
        content: req.body.content,
        authorID: userExist._id,
        videoUrls: uploadUrl.secure_url,
      });

      const savePost = await createPost.save();
      res.status(200).json({ savePost, message: "Video Post" });
    } else if (!videoUrls && !images && req.body.content) {
      const createPost = new post({
        content: req.body.content,
        authorID: userExist._id,
      });

      const savePost = await createPost.save();
      res.status(200).json({ savePost, message: "Content Post" });
    } else {
      res.status(400).json({ message: "Invalid Data Try Again" });
    }

    // const createNotif = new notifications({
    //   instructorID: findInstructor._id,
    //   notifications: `Your Instructor Created New Posts`,
    // });

    // await createNotif.save();
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/:userID/delete-post/:postID", async (req, res) => {
  try {
    const { postID, userID } = req.params;

    const findPost = await post.findOneAndDelete({
      $and: [{ authorID: userID }, { _id: postID }],
    });

    if (!findPost) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({ message: "Deleted Successfully", findPost });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.patch("/:userID/update-post/:postID", async (req, res) => {
  try {
    const { userID, postID } = req.params;
    const images = req.files && req.files.imageUrls;
    const videoUrls = req.files && req.files.videoUrls;

    let updateData = {};

    if (Array.isArray(images)) {
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const uploadResult = await cloudinary.uploader.upload(
            image.tempFilePath
          );
          return uploadResult.secure_url;
        })
      );
      updateData.imageUrls = imageUrls;
    } else if (images) {
      const uploadResult = await cloudinary.uploader.upload(
        images.tempFilePath
      );
      updateData.imageUrls = [uploadResult.secure_url];
    }

    if (videoUrls) {
      const uploadResult = await cloudinary.uploader.upload(
        videoUrls.tempFilePath,
        {
          resource_type: "video",
          folder: "videos",
        }
      );
      updateData.videoUrls = uploadResult.secure_url;
      updateData.imageUrls = []; // Clear imageUrls if video is present
    }

    if (req.body.content) {
      updateData.content = req.body.content;
      updateData.imageUrls = updateData.imageUrls || []; // Ensure imageUrls exists
      updateData.videoUrls = updateData.videoUrls || null; // Ensure videoUrls exists
    }

    if (images && videoUrls) {
      return res
        .status(400)
        .json({ message: "You Cant Upload Videos And Images Together" });
    }

    const findPost = await post.findOneAndUpdate(
      {
        $and: [{ authorID: userID }, { _id: postID }],
      },
      updateData,
      { new: true }
    );

    if (!findPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }
    if (!images && !videoUrls && !req.body.content) {
      return res
        .status(400)
        .json({ message: "You can't post with empty fields" });
    }
    res.status(200).json({ findPost, message: "Post Updated Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
