import { Server } from "socket.io";
import Student from "../models/Student.js";

let ioInstance; // To store the io instance

// const testFunc = async () => {
//   try {

//     const findStudents = await Student.find({ invitedByID: instructorID });

//     for (const student of findStudents) {
//       console.log(`Emitting notification to ${student._id}`);
//       io.to(student._id.toString()).emit("notificationEvent", notificationData);
//     }

//   } catch (error) {
//     console.log(error);
//   }
// }

const connectedUsers = {}; // This object will store socket IDs by user IDs
const notiArray = []; // Array

const SocketManager = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  io.on("connection", (socket) => {
    socket.on("userConnected", (userId) => {
      connectedUsers[userId] = socket.id;
      console.log(connectedUsers);
    });

    socket.on("disconnect", () => {
      // Remove the disconnected user from the connectedUsers object
      const userId = Object.keys(connectedUsers).find(
        (key) => connectedUsers[key] === socket.id
      );
      if (userId) {
        delete connectedUsers[userId];
      }
    });
  });

  ioInstance = io;

  return io;
};

export { SocketManager, ioInstance, connectedUsers, notiArray }; 
