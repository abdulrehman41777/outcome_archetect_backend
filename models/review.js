import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    courseID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courses",
    },
    studentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "students",
    },
    studentImg: {
      type: String,
    },
    studentName: {
      type: String,
    },
    review: {
      type: String,
      require: true,
    },
    rating: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("reviews", reviewSchema);
