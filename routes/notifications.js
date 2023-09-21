import express from "express";
import instructor from "../models/instructor.js";
import notifications from "../models/notifications.js";

const router = express.Router();

router.get("/all-notifications/:instructorID", async (req, res) => {
  try {
    const { instructorID } = req.params;

    const findInstructor = await instructor.findById(instructorID);

    if (!findInstructor) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }
    const getNotifs = await notifications
      .find({
        userID: findInstructor._id,
      })
      .populate({
        model: "instructors",
        path: "userID",
        select: "-password",
      });

    res.status(200).json({ notifications: getNotifs });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
