import express from "express";
import instructor from "../models/instructor.js";
import event from "../models/event.js";
import notifications from "../models/notifications.js";
import moment from "moment";
import momentTz from "moment-timezone";

const router = express.Router();

router.post("/:userID/schedule-event", async (req, res) => {
  try {
    const { userID } = req.params;

    const findInstructor = await instructor.findById(userID);

    if (!findInstructor) {
      return res.status(404).json({ message: "Instructor Not Found" });
    }

    const createEvent = new event({
      instructorID: findInstructor._id,
      title: req.body.title,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    });

    const saveEvents = await createEvent.save();

    const createNotif = new notifications({
      instructorID: findInstructor._id,
      notifications: `New Event Has Scheduled`,
    });

    await createNotif.save();

    res.status(200).json(saveEvents);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.patch("/:userID/update-event/:eventID", async (req, res) => {
  try {
    const { userID, eventID } = req.params;

    const findUser = await instructor.findById(userID);

    if (!findUser) {
      return res.status(404).json({ messsage: "User Not Found" });
    }

    const findEvent = await event.findById(eventID);

    if (!findEvent) {
      return res.status(404).json({ message: "Event Not Found" });
    }

    findEvent.title = req.body.title;
    findEvent.date = req.body.date;
    findEvent.startTime = req.body.startTime;
    findEvent.endTime = req.body.endTime;
    findEvent.status = req.body.status;

    const saveUpdated = await findEvent.save();

    res.status(200).json(saveUpdated);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// router.get("/:userID/get-schedules-by-instructor", async (req, res) => {
//   try {
//     const { userID } = req.params;
//     const findUser = await instructor.findById(userID);
//     if (!findUser) {
//       return res.status(404).json({ message: "User Not Found" });
//     }

//     const findEvents = await event.find({ instructorID: findUser._id });

//     // Extract instructor IDs from events
//     const instructorIDs = findEvents.map((event) => event.instructorID);

//     // Fetch instructor data for all instructor IDs excluding certain fields
//     const instructorsData = await instructor.find(
//       { _id: { $in: instructorIDs } },
//       { password: 0, role: 0, bio: 0 }
//     );

//     // Map instructor data to corresponding events
//     const eventsWithInstructors = findEvents.map((event) => {
//       const instructorData = instructorsData.find((instructor) =>
//         instructor._id.equals(event.instructorID)
//       );
//       return {
//         ...event.toObject(),
//         username: instructorData.username,
//         profileImg: instructorData.profileImg,
//       };
//     });

//     res.status(200).json(eventsWithInstructors);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json(error);
//   }
// });

router.get("/all-events", async (req, res) => {
  try {
    const findEvents = await event.find().populate({
      model: "instructors",
      path: "instructorID",
      select: "username profileImg",
    });
    res.status(200).json(findEvents);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/:userID/delete-event/:eventID", async (req, res) => {
  try {
    const { userID, eventID } = req.params;
    const findUser = await instructor.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const findEvent = await event.findOneAndDelete({
      _id: eventID,
      instructorID: userID,
    });

    if (!findEvent) {
      return res.status(404).json({ message: "Event Not Found" });
    }

    res.status(200).json(findEvent);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/:userID/get-schedules-by-instructor", async (req, res) => {
  try {
    const { userID } = req.params;
    const findUser = await instructor.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const findEvents = await event.find({ instructorID: findUser._id });

    const currentTime = momentTz.tz(moment(), "Asia/Karachi");
    const getDate = moment().format("YYYY-MM-DD");

    const resDate = moment(currentTime).format("HH:mm:ss");
    const timeSplitter = resDate.split(":");
    const hour = timeSplitter[0];
    const min = timeSplitter[1];
    const joined = `${hour}:${min}`;

    // Filter events that are not expired
    const nonExpiredEvents = findEvents.filter((event) => {
      console.log("Event Date:", event.date);
      console.log("Event End Time:", event.endTime);
      console.log("Current Date:", getDate);
      console.log("Current Time:", joined);
      return event.date >= getDate && event.endTime >= joined; // Check if event end time is in the future
    });

    // // Filter events that are not expired
    // const nonExpiredEvents = findEvents.filter((event) => {
    //   return event.date >= getDate && event.endTime >= joined; // Check if event end time is in the future
    // });

    // Extract instructor IDs from non-expired events
    const instructorIDs = nonExpiredEvents.map((event) => event.instructorID);

    // Fetch instructor data for all instructor IDs excluding certain fields
    const instructorsData = await instructor.find(
      { _id: { $in: instructorIDs } },
      { password: 0, role: 0, bio: 0 }
    );

    // Map instructor data to corresponding events
    const eventsWithInstructors = nonExpiredEvents.map((event) => {
      const instructorData = instructorsData.find((instructor) =>
        instructor._id.equals(event.instructorID)
      );
      return {
        ...event.toObject(),
        username: instructorData.username,
        profileImg: instructorData.profileImg,
      };
    });

    res.status(200).json(eventsWithInstructors);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
