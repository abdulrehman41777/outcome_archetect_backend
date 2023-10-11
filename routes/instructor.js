import express from "express";
import instructor from "../models/instructor.js";
import transporter from "../utils/NodeMailerConfig.js";
import admin from "../models/admin.js";
import Student from "../models/Student.js";
import courses from "../models/courses.js";
import event from "../models/event.js";
import notifications from "../models/notifications.js";
import post from "../models/post.js";

const router = express.Router();

router.post("/register-instructor", async (req, res) => {
  try {
    const existingAdmin = await admin.findOne({
      email: req.body.email,
    });
    const existingStudent = await Student.findOne({
      email: req.body.email,
    });
    const existingInstructor = await instructor.findOne({
      email: req.body.email,
    });

    if (existingStudent || existingInstructor || existingAdmin) {
      return res.status(400).json({ message: "This Email Already Exists" });
    } else {
      const createInstructor = new instructor({
        username: "",
        email: req.body.email,
        phone: "",
        password: req.body.password,
        state: "",
        city: "",
        zipCode: "",
        dob: null,
      });

      const saveInstructor = await createInstructor.save();

      const mailOptions = {
        from: "outcomearchitect@gmail.com",
        to: req.body.email,
        subject: "Welcome to OutCome Arcitect!",
        html: `
        <h3><b>Welcome to OutCome Architect</b></h3>
        <br>
        <h3><b>You Are Invited By Admin</b></h3>
        <br>
       <h5> Please Login As A <b>${saveInstructor.role}</b> </h5>
       <a href='http://localhost:3000' target="_blank"> Click Here To Login As A <b>${saveInstructor.role}</b> </a>
       <br>
        Your Email : ${saveInstructor.email}
        <br>
        Your Password : ${saveInstructor.password}
        `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      res.status(200).json(saveInstructor);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/all-instructors", async (req, res) => {
  try {
    const findInstructor = await instructor.find();
    res.status(200).json({ instructors: findInstructor });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/delete-instrctor/:instructorID", async (req, res) => {
  try {
    const { instructorID } = req.params;
    const findInstructor = await instructor.findById(instructorID);
    if (!findInstructor) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }
    await courses.deleteMany({
      instructorID: findInstructor._id,
    });
    await event.deleteMany({
      instructorID: findInstructor._id,
    });
    await notifications.deleteMany({
      userID: findInstructor._id,
    });
    await post.deleteMany({
      authorID: findInstructor._id,
    });
    await post.updateMany(
      { "likes._id": findInstructor._id },
      { $pull: { likes: { _id: findInstructor._id } } }
    );
    await post.updateMany(
      { "comments.userID": findInstructor._id },
      { $pull: { comments: { userID: findInstructor._id } } }
    );

    const findStudent = await Student.find({
      $and: [{ invitedByID: findInstructor._id }],
    });

    await post.updateMany(
      { "comments.replies.userID": { $in: findStudent._id } },
      { $pull: { "comments.$.replies": { userID: findInstructor._id } } }
    );

    await Student.deleteMany({
      invitedByID: findInstructor._id,
    });

    await instructor.findByIdAndDelete(findInstructor._id);

    res.status(200).json(findInstructor);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
