const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    lastMessage: {
      text: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    isGroup: {
      type: Boolean,
      default: false
    },
    groupName: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);