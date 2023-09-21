import express, { response } from "express";
import student from "../models/Student.js";
import admin from "../models/admin.js";
import instructor from "../models/instructor.js";
import transporter from "../utils/NodeMailerConfig.js";
import post from "../models/post.js";
import review from "../models/review.js";

const router = express.Router();

router.post("/register-student", async (req, res) => {
  try {
    const existingAdmin = await admin.findOne({
      email: req.body.email,
    });
    const existingInstructor = await instructor.findOne({
      email: req.body.email,
    });
    const existingStudent = await student.findOne({
      email: req.body.email,
    });

    const findInvitedBy = await instructor.findOne({
      _id: req.body.invitedByID,
    });

    if (existingStudent || existingInstructor || existingAdmin) {
      return res.status(400).json({ message: "This Email Already Exists" });
    }

    if (!findInvitedBy) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }

    const createStudent = new student({
      username: "",
      email: req.body.email,
      phone: "",
      password: req.body.password,
      state: "",
      city: "",
      zipCode: "",
      dob: null,
      invitedByID: findInvitedBy._id,
      invitedByEmail: findInvitedBy.email,
    });

    const saveStudent = await createStudent.save();

    const mailOptions = {
      from: "outcomearchitect@gmail.com",
      to: req.body.email,
      subject: "Welcome to OutCome Arcitect!",
      html: `
      <h3><b>Welcome to OutCome Architect</b></h3>
      <br>
      <h3><b>You Are Invited By ${findInvitedBy.email}</b></h3>
      <br>
     <h5> Please Login As A <b>${saveStudent.role}</b> </h5>
     <a href='http://localhost:3000' target="_blank"> Click Here To Login As A <b>${saveStudent.role}</b> </a>
     <br>
      Your Email : ${saveStudent.email}
      <br>
      Your Password : ${saveStudent.password}
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.status(200).json(saveStudent);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/all-students/:instructorID", async (req, res) => {
  try {
    const { instructorID } = req.params;

    const findInstructor = await instructor.findById(instructorID);

    if (!findInstructor) {
      return res.status(404).json({ message: "Not Found" });
    }

    const findStudents = await student
      .find({
        invitedByID: findInstructor._id,
      })
      .populate({
        path: "invitedByID",
        model: "instructors",
        select: "username profileImg",
      });

    res.status(200).json({ students: findStudents });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/:instructorID/all-posts", async (req, res) => {
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
    res.status(500).json(error);
  }
});

router.delete("/delete-students/:studentID", async (req, res) => {
  try {
    const { studentID } = req.params;
    const findStudent = await student.findById(studentID);
    if (!findStudent) {
      return res.status(404).json({ message: "Student Not Found" });
    }
    await post.updateMany(
      { "likes._id": findStudent._id },
      { $pull: { likes: { _id: findStudent._id } } }
    );
    await post.updateMany(
      { "comments.userID": findStudent._id },
      { $pull: { comments: { userID: findStudent._id } } }
    );
    await post.updateMany(
      { "comments.replies.userID": findStudent._id },
      { $pull: { "comments.$.replies": { userID: findStudent._id } } }
    );
    await review.deleteMany({ studentID: findStudent._id });
    await student.findByIdAndDelete(findStudent._id);
    res.status(200).json(findStudent);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/all-students", async (req, res) => {
  try {
    const allStudents = await student.find().populate({
      path: "invitedByID",
      model: "instructors",
      select: "username profileImg",
    });
    res.status(200).json({ students: allStudents });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
