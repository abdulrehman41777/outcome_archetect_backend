 import mongoose from "mongoose";
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    instructorID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
    },
    title: {
      type: String,
      require: true,
    },
    desc: {
      type: String,
      require: true,
    },
    courseThumbnail: {
      type: String,
      require: true,
    },
    files: {
      type: [String],
    },
    
  },
  { timestamps: true }
);

export default mongoose.model("courses", courseSchema);
