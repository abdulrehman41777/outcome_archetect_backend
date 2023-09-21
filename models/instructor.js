import mongoose from "mongoose";
const { Schema } = mongoose;

const instructorSchema = new Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: Number,
  },
  password: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  dob: {
    type: String,
  },
  bio: {
    type: String,
  },
  profileImg: {
    type: String,
    default:
      "https://res.cloudinary.com/dnsaxzqz8/image/upload/v1689613800/user_profile_ykd77q.png",
  },
  role: {
    type: [String],
    enum: ["Instructor"],
    default: ["Instructor"],
  },
  sharedPosts: [
    {
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      postID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
      },
    },
  ],
});

export default mongoose.model("instructors", instructorSchema);
