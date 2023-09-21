import express from "express";
import admin from "../models/admin.js";
import instructor from "../models/instructor.js";
import student from "../models/Student.js";
import post from "../models/post.js";
import Student from "../models/Student.js";
import event from "../models/event.js";
import { v2 as cloudinary } from "cloudinary";
import courses from "../models/courses.js";

const router = express.Router();

cloudinary.config({
  cloud_name: "dnsaxzqz8",
  api_key: "567833932974999",
  api_secret: "dQT4OyDnZZsWWjsCDqUHbEEDedg",
});

router.post("/create-admin", async (req, res) => {
  try {
    const findAdmin = await admin.findOne({ email: req.body.email });

    if (findAdmin) {
      return res.status(400).json({ message: "Admin Already Exists" });
    }

    const createAdmin = new admin({
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      bio: req.body.bio,
      password: req.body.password,
    });

    const saveAdmin = await createAdmin.save();

    res.status(200).json(saveAdmin);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const findAdmin = await admin.findOne({ email: req.body.email });
    const findInstructor = await instructor.findOne({ email: req.body.email });
    const findStudent = await student.findOne({ email: req.body.email });

    let userExist;

    if (findAdmin) {
      userExist = findAdmin;
    } else if (findInstructor) {
      userExist = findInstructor;
    } else if (findStudent) {
      userExist = findStudent;
    } else {
      return res.status(404).json({ message: "Not Found" });
    }

    if (
      userExist.password === req.body.password &&
      userExist.email === req.body.email
    ) {
      res
        .status(200)
        .json({ message: "Logged In Successful", user: userExist });
    } else {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.patch("/complete-info/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    const findAdmin = await admin.findById(userID);
    const findInstructor = await instructor.findById(userID);
    const findStudent = await student.findById(userID);

    let userExist;

    if (findAdmin) {
      userExist = findAdmin;
    } else if (findInstructor) {
      userExist = findInstructor;
    } else if (findStudent) {
      userExist = findStudent;
    } else {
      return res.status(404).json({ message: "Not Found" });
    }

    userExist.username = req.body.username || userExist.username;
    userExist.phone = req.body.phone || userExist.phone;
    userExist.state = req.body.state || userExist.state;
    userExist.city = req.body.city || userExist.city;
    userExist.zipCode = req.body.zipCode || userExist.zipCode;
    userExist.dob = req.body.dob || userExist.dob;
    userExist.bio = req.body.bio || userExist.bio;

    const saveUpdates = await userExist.save();

    res.status(200).json({ user: saveUpdates });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/get-all-posts", async (req, res) => {
  try {
    const getPosts = await post.find().sort({ createdAt: -1 });

    const allAuthors = getPosts.map((post) => post.authorID);

    const findAuthors = await instructor.find({ _id: { $in: allAuthors } });

    const combinedData = getPosts.map((post) => {
      const author = findAuthors.find(
        (author) => author._id.toString() === post.authorID.toString()
      );
      return {
        ...post._doc,
        author,
      };
    });

    res.status(200).json({ allPosts: combinedData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:userID/update-user", async (req, res) => {
  try {
    const { userID } = req.params;

    const findUser =
      (await Student.findById(userID)) ||
      (await instructor.findById(userID)) ||
      (await admin.findById(userID));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const profile = req.files && req.files.profileImg;

    let uploadResult;
    if (profile && profile.tempFilePath) {
      uploadResult = await cloudinary.uploader.upload(profile.tempFilePath);
    }

    findUser.username = req.body.username || findUser.username;
    findUser.phone = req.body.phone || findUser.phone;
    findUser.state = req.body.state || findUser.state;
    findUser.city = req.body.city || findUser.city;
    findUser.zipCode = req.body.zipCode || findUser.zipCode;
    findUser.dob = req.body.dob || findUser.dob;
    findUser.bio = req.body.bio || findUser.bio;
    findUser.profileImg = uploadResult
      ? uploadResult.secure_url
      : findUser.profileImg;

    const saveUpdatedUser = await findUser.save();

    res.status(200).json(saveUpdatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/single-user/:userID", async (req, res) => {
  try {
    const { userID } = req.params;
    const findUser =
      (await student.findById(userID)) ||
      (await instructor.findById(userID)) ||
      (await admin.findById(userID));
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }
    res.status(200).json(findUser);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/user-data/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    const findUser =
      (await instructor.findById(userID)) ||
      (await student.findById(userID)) ||
      (await admin.findById(userID));

    if (!findUser) {
      res.status(404).json({ message: "User Not Found" });
    }

    if (findUser.role[0] === "Instructor") {
      const findPosts = await post
        .find({
          authorID: findUser._id.toString(),
        })
        .count();

      const findCourses = await courses
        .find({
          instructorID: findUser._id.toString(),
        })
        .count();
      const findEvents = await event
        .find({
          instructorID: findUser._id.toString(),
        })
        .count();
      const findStudents = await student
        .find({
          invitedByID: findUser._id.toString(),
        })
        .count();

      res.status(200).json({
        students: findStudents,
        posts: findPosts,
        courses: findCourses,
        events: findEvents,
      });
    } else if (findUser.role[0] === "Student") {
      const findStudents = await student.find({
        _id: findUser._id.toString(),
      });

      const studentIDs = findStudents.map((item) =>
        item.invitedByID.toString()
      );

      const findPosts = await post
        .find({
          authorID: { $in: studentIDs },
        })
        .count();

      const findCourses = await courses
        .find({
          instructorID: { $in: studentIDs },
        })
        .count();
      const findEvents = await event
        .find({
          instructorID: { $in: studentIDs },
        })
        .count();

      res.status(200).json({
        posts: findPosts,
        courses: findCourses,
        events: findEvents,
      });
    } else if (findUser.role[0] === "Admin") {
      const findPosts = await post.find().count();
      const findCourses = await courses.find().count();
      const findEvents = await event.find().count();
      const findStudents = await student.find().count();

      res.status(200).json({
        students: findStudents,
        posts: findPosts,
        courses: findCourses,
        events: findEvents,
      });
    } else {
      return res.status(400).json("Bad Request");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
