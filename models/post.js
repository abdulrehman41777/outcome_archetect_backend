import mongoose from "mongoose";
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    content: {
      type: String,
    },
    imageUrls: {
      type: [String],
    },
    videoUrls: {
      type: String,
    },
    likes: [
      {
        userID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin Instructor Student",
        },
        userName: {
          type: String,
        },
        profileImg: {
          type: String,
        },
        userType: {
          type: String,
        },
      },
    ],
    comments: [
      {
        userID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comments: String,
        username: String,
        profileImg: String,
        userType: String,
        replies: [
          {
            userID: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            comments: String,
            profileImg: String,
            username: String,
            userType: String,
          },
        ],
      },
    ],
    authorID: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
      },
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("posts", postSchema);
