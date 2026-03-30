const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("Missing environment variable AUTH_SECRET");
}

function verifyAuthToken(token) {
  return jwt.verify(token, AUTH_SECRET);
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing environment variable MONGODB_URI");
  }

  return mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 10000, // 10 seconds
    maxPoolSize: 10,
    retryWrites: true
  });
}

let io = null;
const userSocketMap = new Map(); // userId -> socketId

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Configure this for production
      methods: ["GET", "POST"],
      credentials: true
    },
    path: "/socket.io"
  });

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const payload = verifyAuthToken(token);
      socket.data.userId = payload.userId;
      socket.data.userRole = payload.role;
      socket.data.userEmail = payload.email;
      socket.data.deviceId = payload.deviceId;

      // Enforce single-device login when deviceId is set for the user.
      await connectDB();
      const UserModel = (await import("../models/User")).default;
      const userDoc = await UserModel.findById(payload.userId).lean();
      if (userDoc?.deviceId && (!payload.deviceId || payload.deviceId !== userDoc.deviceId)) {
        return next(new Error("Authentication error: Device mismatch"));
      }

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Notify user about online status (optional)
      socket.broadcast.emit("user:online", { userId });

      // Join user's personal room
      socket.join(`user:${userId}`);
    }

    // Send message event
    socket.on("message:send", async (data) => {
      try {
        if (!userId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const { recipientId, content } = data;

        // Connect to DB and import Message model
        await connectDB();
        const MessageModel = (await import("../models/Message")).default;

        // Save message to database
        const message = await MessageModel.create({
          sender: new mongoose.Types.ObjectId(userId),
          recipient: new mongoose.Types.ObjectId(recipientId),
          content: content.trim()
        });

        await message.populate("sender", "name email role department");
        await message.populate("recipient", "name email role department");

        const messageData = {
          id: message._id.toString(),
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          read: message.read,
          createdAt: message.createdAt
        };

        // Send to recipient if online
        const recipientSocketId = userSocketMap.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message:new", messageData);
        }

        // Send confirmation to sender
        socket.emit("message:sent", messageData);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark message as read
    socket.on("message:read", async (data) => {
      try {
        if (!userId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const { messageId } = data;
        await connectDB();
        const MessageModel = (await import("../models/Message")).default;
        const message = await MessageModel.findById(messageId);

        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        if (message.recipient.toString() !== userId) {
          socket.emit("error", { message: "Forbidden" });
          return;
        }

        if (!message.read) {
          message.read = true;
          message.readAt = new Date();
          await message.save();

          // Notify sender that message was read
          const senderSocketId = userSocketMap.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("message:read-receipt", {
              messageId: message._id.toString(),
              readAt: message.readAt
            });
          }
        }

        socket.emit("message:read-success", {
          messageId: message._id.toString(),
          read: true
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", { message: "Failed to mark message as read" });
      }
    });

    // Typing indicator
    socket.on("typing:start", (data) => {
      const { recipientId } = data;
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:start", { userId });
      }
    });

    socket.on("typing:stop", (data) => {
      const { recipientId } = data;
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:stop", { userId });
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`User ${userId} disconnected`);
        socket.broadcast.emit("user:offline", { userId });
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initializeSocket, getIO };

