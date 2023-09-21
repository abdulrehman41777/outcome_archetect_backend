import mongoose from "mongoose";
const { Schema } = mongoose;

const notifSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("notifications", notifSchema);
