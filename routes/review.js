import express, { response } from "express";
import review from "../models/review.js";
import student from "../models/Student.js";
// import course from "../models/courses.js";
import courses from "../models/courses.js";

const router = express.Router();

router.post("/:courseID/post-review/:studentID", async (req, res) => {
  try {
    const { courseID, studentID } = req.params;
    const findStudent = await student.findById(studentID);
    const findCourses = await courses.findById(courseID);

    if (!findStudent) {
      return res.status(404).json({ message: "Student Not Found" });
    }

    if (!findCourses) {
      return res.status(404).json({ message: "Student Not Found" });
    }

    const createReview = new review({
      courseID: findCourses._id,
      studentID: findStudent._id,
      review: req.body.review,
      rating: req.body.rating,
    });

    const saveReview = await createReview.save();

    res.status(200).json(saveReview);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get("/:courseID/all-reviews", async (req, res) => {
  try {
    const { courseID } = req.params;
    const findCourse = await courses.findById(courseID);
    const findReviews = await review.find({ courseID: courseID }).populate({
      path: "studentID",
      model: "students",
      select:"username profileImg"
    });

    if (!findCourse) {
      return res.status(404).json({ message: "Course Not Found" });
    }

    if (!findReviews) {
      return res.status(404).json({ message: "No Reviews Found" });
    }

    res.status(200).json({ reviews: findReviews });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.patch(
  "/:courseID/update-review/:studentID/:reviewID",
  async (req, res) => {
    try {
      const { courseID, studentID, reviewID } = req.params;
      const findStudent = await student.findById(studentID);
      if (!findStudent) {
        return res.status(404).json({ message: "Student Not Found" });
      }
      const findCourses = await courses.findById(courseID);
      if (!findCourses) {
        return res.status(404).json({ message: "Course Not Found" });
      }
      const findReview = await review.findById(reviewID);
      if (!findReview) {
        return res.status(404).json({ message: "Review Not Found" });
      }
      findReview.rating = req.body.rating || findReview.rating;
      const updateReview = await findReview.save();
      res.status(200).json(updateReview);
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
);

router.get("/:courseID/average-reviews", async (req, res) => {
  try {
    const { courseID } = req.params;
    const findRatings = await review.find({ courseID: courseID });

    if (findRatings.length === 0) {
      return res
        .status(404)
        .json({ message: "No ratings found for the course" });
    }

    const totalRatings = findRatings.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalRatings / findRatings.length;

    res.status(200).json({ averageRating });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/delete-review/:reviewID", async (req, res) => {
  try {
    const { reviewID } = req.params;
    const deleteReview = await review.findByIdAndDelete(reviewID);
    if (!deleteReview) {
      return res.status(404).json({ message: "Review Not Found" });
    }
    res.status(200).json({ message: "Review Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
