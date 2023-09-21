import mongoose from "mongoose";
const { Schema } = mongoose;

const adminSchema = new Schema({
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
    enum: ["Admin"],
    default: ["Admin"],
  },
  
});

export default mongoose.model("admin", adminSchema);
