import mongoose from "mongoose";
const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    instructorID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "instructor",
      required: true,
    },
    date: {
      type: String,
      require: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      require: true,
    },
    status: {
      type: [String],
      require: true,
      enum: ["Pending", "Upcoming"],
      default: ["Pending"],
    },
  },

  { timestamps: true }
);

export default mongoose.model("events", eventSchema);
