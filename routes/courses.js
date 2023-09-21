import express, { response } from "express";
import instructor from "../models/instructor.js";
import courses from "../models/courses.js";
import { v2 as cloudinary } from "cloudinary";
import notifications from "../models/notifications.js";
import student from "../models/Student.js";
import {
  connectedUsers,
  ioInstance,
  notiArray,
} from "../socket/SocketManager.js";

const router = express.Router();

cloudinary.config({
  cloud_name: "dnsaxzqz8",
  api_key: "567833932974999",
  api_secret: "dQT4OyDnZZsWWjsCDqUHbEEDedg",
});

router.post("/create-course/:instructorID", async (req, res) => {
  try {
    const { instructorID } = req.params;

    const findInstructor = await instructor.findById(instructorID);

    if (!findInstructor) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }

    const courseFiles = req.files && req.files.files;
    const files = [];

    if (Array.isArray(courseFiles)) {
      // Handle multiple file uploads
      for (const file of courseFiles) {
        const uploadResult = await cloudinary.uploader.upload(
          file?.tempFilePath
        );
        files.push(uploadResult.secure_url);
      }
    } else if (courseFiles) {
      // Handle single file upload
      const uploadResult = await cloudinary.uploader.upload(
        courseFiles?.tempFilePath
      );
      files.push(uploadResult.secure_url);
    }

    const thumbnail = req.files && req.files.courseThumbnail;

    const uploadUrl = await cloudinary.uploader.upload(
      thumbnail?.tempFilePath,
      {
        folder: "courses",
      }
    );

    const createCourse = new courses({
      instructorID: findInstructor._id,
      title: req.body.title,
      desc: req.body.desc,
      courseThumbnail: uploadUrl.secure_url,
      files,
    });

    const saveCourse = await createCourse.save();

    // Emit a notification event to connected clients
    const notificationData = {
      userID: findInstructor._id,
      title: "New Course Available",
      message: `A new course "${saveCourse.title}" is now available!`,
    };

    // Access the io instance from req.app
    const io = req.app.get("io");

    console.log("Emitting notification...");

    // const findStudents = await student.find({ invitedByID: instructorID });

    // for (const student of findStudents) {
    //   console.log(`Emitting notification to ${student._id}`);
    //   io.to(student._id.toString()).emit("notificationEvent", notificationData);
    // }

    const findStudents = await student.find({ invitedByID: instructorID });

    console.log("Emitting notifications...");
    for (const student of findStudents) {
      console.log("connectedUsers : ", connectedUsers);
      // const userSocketId = JSON.stringify(connectedUsers);
      const userSocketId = connectedUsers[student._id];
      console.log(userSocketId, "connectedUsers");
      // console.log(JSON.stringify(userSocketId)
      // const userSocketId = connectedUsers[student._id];
      console.log(`User ${student._id.toString()}: socket ID ${userSocketId}`);

      if (userSocketId) {
        notiArray.push(notificationData);
        io.in(userSocketId).emit("notificationEvent", notiArray);
        console.log(`Emitting notification to user ${student._id}`);
      } else {
        console.log(`No socket ID found for user ${student._id}`);
      }
    }

    // io.emit("notificationEvent", notificationData);

    // Other code as needed

    const createNotif = new notifications({
      userID: findInstructor._id,
      title: notificationData.title,
      message: notificationData.message,
    });

    await createNotif.save();

    res.status(200).json({
      message: "Course Has Been Updated Successfully",
      saveCourse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/all-courses/:instructorID", async (req, res) => {
  try {
    const { instructorID } = req.params;

    const findInstructors = await instructor.findById(instructorID);

    if (!findInstructors) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }

    const findCourses = await courses
      .find({
        instructorID: findInstructors._id,
      })
      .populate({
        path: "instructorID",
        model: "instructors",
        select: "username profileImg",
      });

    res.status(200).json({ courses: findCourses });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/single-course/:courseID", async (req, res) => {
  try {
    const { courseID } = req.params;

    const findCourse = await courses.findById(courseID);
    if (!findCourse) {
      return res.status(404).json({ message: "Course Not Found" });
    }

    const instructorID = findCourse.instructorID;
    const findInstructor = await instructor.findById(instructorID);

    if (!findInstructor) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }

    const singleCourse = {
      course: findCourse,
      instructor: {
        username: findInstructor.username,
        profileImg: findInstructor.profileImg,
      },
    };

    res.status(200).json(singleCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/all-courses", async (req, res) => {
  try {
    const findCourses = await courses.find().populate({
      path: "instructorID",
      model: "instructors",
      select: "username profileImg",
    });
    res.status(200).json({ courses: findCourses });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/:instructorID/delete-courses/:courseID", async (req, res) => {
  try {
    const { courseID, instructorID } = req.params;
    const findCourses = await courses.findById(courseID);
    if (!findCourses) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }

    const deleteCourse = await courses.findOneAndDelete({
      $and: [{ _id: findCourses._id, instructorID: instructorID }],
    });

    if (!deleteCourse) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    res.status(200).json(deleteCourse);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.patch("/:instructorID/update-course/:courseID", async (req, res) => {
  try {
    const { courseID, instructorID } = req.params;

    const findCourse = await courses.findById(courseID);

    if (!findCourse) {
      return res.status(404).json({ message: "Course Not Found" });
    }

    const thumbnail = req.files && req.files.courseThumbnail;

    const updateData = {
      title: req.body.title || findCourse.title,
      desc: req.body.desc || findCourse.desc,
    };

    if (thumbnail && thumbnail.tempFilePath) {
      const uploadResult = await cloudinary.uploader.upload(
        thumbnail.tempFilePath,
        {
          folder: "courses",
        }
      );
      updateData.courseThumbnail = uploadResult.secure_url;
    }

    const updateCourse = await courses.findOneAndUpdate(
      {
        _id: courseID,
        instructorID: instructorID,
      },
      updateData,
      { new: true } // This ensures you get the updated document in the response
    );

    if (!updateCourse) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    res.status(200).json(updateCourse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch(
  "/:instructorID/upload-course-files/:courseID",
  async (req, res) => {
    try {
      const { instructorID, courseID } = req.params;

      const findInstructor = await instructor.findById(instructorID);

      const courseFiles = req.files && req.files.files;
      const files = [];

      if (!findInstructor) {
        return res.status(404).json({ message: "Instructor Not Found" });
      }

      // Check if files were uploaded
      if (!courseFiles) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      if (Array.isArray(courseFiles)) {
        // Handle multiple file uploads
        for (const file of courseFiles) {
          const uploadResult = await cloudinary.uploader.upload(
            file.tempFilePath // Use file.tempFilePath instead of file?.tempFilePath
          );
          files.push(uploadResult.secure_url);
        }
      } else {
        // Handle single file upload
        const uploadResult = await cloudinary.uploader.upload(
          courseFiles.tempFilePath // Use courseFiles.tempFilePath instead of courseFiles?.tempFilePath
        );
        files.push(uploadResult.secure_url);
      }

      // Update the course's files in the database
      const findCourse = await courses.findOneAndUpdate(
        {
          _id: courseID,
          instructorID: instructorID,
        },
        { $push: { files: files } }, // Use $push directly on the "files" array
        { new: true } // Return the updated document
      );

      if (!findCourse) {
        return res.status(404).json({ message: "Course Not Found" });
      }

      // const createNotif = new notifications({
      //   instructorID: findInstructor._id,
      //   courseID: saveCourse._id,
      //   notifications: `New Classes Updated In <b>${saveCourse.title}</b> `,
      // });

      // await createNotif.save();

      res.status(200).json({ message: "Course files updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
);

router.patch(
  "/:instructorID/remove-course-files/:courseID",
  async (req, res) => {
    try {
      const { instructorID, courseID } = req.params;

      const findInstructor = await instructor.findById(instructorID);
      if (!findInstructor) {
        return res.status(404).json({ message: "Instructor Not Found" });
      }

      const findCourse = await courses.findOne({ _id: courseID });
      if (!findCourse) {
        return res.status(404).json({ message: "Course Not Found" });
      }

      const filesToRemove = req.body.files; // Array of file URLs to remove

      // Update the course to remove specific files from the "files" array
      const updatedCourse = await courses.findOneAndUpdate(
        {
          _id: courseID,
          instructorID: instructorID,
        },
        { $pullAll: { files: filesToRemove } }, // Remove files with matching URLs
        { new: true } // Return the updated document
      );

      if (!updatedCourse) {
        return res.status(404).json({ message: "Course Not Found" });
      }

      res.status(200).json({
        message: "Course files removed successfully",
        updatedCourse,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
);

export default router;
