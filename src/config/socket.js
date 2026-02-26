const { Server } = require("socket.io");
const Message = require("../models/message"); 
const Conversation=require('../models/conversation')
const User=require('../models/user')
const onlineUsers = new Map();

const activeChats = new Map();

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });
  // const io = new Server(server, {
  //   cors: {
  //     origin: [
  //   "http://localhost:5173",
  //   "http://192.168.137.1:5173"  
  // ], // frontend URL
  //     credentials: true,
  //   },
  // });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);


    socket.on("register", (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
      console.log("User registered:", userId);
    });

    socket.on("open_chat", ({ userId, withUserId }) => {
      activeChats.set(userId.toString(), withUserId.toString());
      console.log(`${userId} opened chat with ${withUserId}`);
    });


    socket.on("leave_chat", (userId) => {
      activeChats.delete(userId.toString());
    });



    socket.on("send_message", async ({ senderId, receiverId, text }) => {
      try {

        let conversation = await Conversation.findOne({
          members: { $all: [senderId, receiverId] },
          isGroup: false
        });

        if (!conversation) {
          conversation = await Conversation.create({
            members: [senderId, receiverId]
          });
        }

        const msg = await Message.create({
          conversationId: conversation._id,
          senderId,
          receiverId,
          text
        });

        conversation.lastMessage = {
          text,
          senderId
        };
        await conversation.save();


        const senderSocket = onlineUsers.get(senderId.toString());
        const receiverSocket = onlineUsers.get(receiverId.toString());
        const receiverActiveChat = activeChats.get(receiverId.toString());

        if (senderSocket) {
          io.to(senderSocket).emit("receive_message", msg);
        }

        if (receiverSocket) {
          if (
            receiverActiveChat &&
            receiverActiveChat.toString() === senderId.toString()
          ) {
            io.to(receiverSocket).emit("receive_message", msg);
          } else {
            io.to(receiverSocket).emit("new_message_notification", {
              from: senderId,
              message: text,
              createdAt: msg.createdAt,
            });
          }
        }

        if (senderSocket) io.to(senderSocket).emit("sidebar_update");
        if (receiverSocket) io.to(receiverSocket).emit("sidebar_update");

      } catch (err) {
        console.log("Message error:", err);
      }
    });


    socket.on("send_group_message", async ({ senderId, conversationId, text }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isGroup) return;

        const msg = await Message.create({
          conversationId: conversation._id,
          senderId,
          text
        });
        
        conversation.lastMessage = { text, senderId };
        await conversation.save();
        const senderData = await User.findById(senderId);
        const resMsg={
          _id:msg._id,
          senderId,
          senderName:senderData.name,
          senderAvatar:senderData.profileURL,
          text,
          createdAt:msg.createdAt
        }
        conversation.members.forEach((memberId) => {
          const memberIdStr = memberId.toString();
          const memberSocket = onlineUsers.get(memberIdStr);
          const memberActiveChat = activeChats.get(memberIdStr);

          if (memberSocket) {

            if (memberIdStr === senderId.toString()) {
              io.to(memberSocket).emit("receive_message", resMsg);
              io.to(memberSocket).emit("sidebar_update");
            } 

            else {

              if (memberActiveChat === conversationId.toString()) {
                io.to(memberSocket).emit("receive_message", resMsg);
              } else {
                io.to(memberSocket).emit("new_message_notification", {
                  from: senderId,
                  groupId: conversationId,
                  groupName: conversation.groupName,
                  message: text,
                  createdAt: msg.createdAt,
                });
              }
              io.to(memberSocket).emit("sidebar_update");
            }
          }
        });

      } catch (err) {
        console.log("Group Message error:", err);
      }
    });

    //   try {
    //     const conversation = await Conversation.findById(conversationId);
    //     if (!conversation || !conversation.isGroup) return;

    //     const msg = await Message.create({
    //       conversationId: conversation._id,
    //       senderId,
    //       text
    //     });
        
    //     conversation.lastMessage = { text, senderId };
    //     await conversation.save();
        
    //     // Fetch sender details
    //     const senderData = await User.findById(senderId);
        
    //     // ⭐ FORMAT FIX: Match the exact keys used in your GET /chat/:id route
    //     const baseResMsg = {
    //       id: msg._id,                           // Changed from _id to id
    //       senderAvatar: senderData.profileURL,   // Changed from profileUrl to profileURL (case-sensitive!)
    //       text: text,
    //       time: msg.createdAt                    // Changed from createdAt to time
    //     };

    //     conversation.members.forEach((memberId) => {
    //       const memberIdStr = memberId.toString();
    //       const memberSocket = onlineUsers.get(memberIdStr);
    //       const memberActiveChat = activeChats.get(memberIdStr);

    //       if (memberSocket) {
            
    //         // If sending back to the person who typed it
    //         if (memberIdStr === senderId.toString()) {
    //           // Match your REST API's 'me' logic for the sender
    //           const senderResMsg = { ...baseResMsg, senderId: 'me', senderName: 'Me' };
    //           io.to(memberSocket).emit("receive_message", senderResMsg);
    //           io.to(memberSocket).emit("sidebar_update");
    //         } 
            
    //         // If sending to the other group members
    //         else {
    //           const receiverResMsg = { ...baseResMsg, senderId: senderId, senderName: senderData.name };

    //           if (memberActiveChat === conversationId.toString()) {
    //             io.to(memberSocket).emit("receive_message", receiverResMsg);
    //           } else {
    //             io.to(memberSocket).emit("new_message_notification", {
    //               from: senderId,
    //               groupId: conversationId,
    //               groupName: conversation.groupName,
    //               message: text,
    //               createdAt: msg.createdAt,
    //             });
    //           }
    //           io.to(memberSocket).emit("sidebar_update");
    //         }
    //       }
    //     });

    //   } catch (err) {
    //     console.log("Group Message error:", err);
    //   }
    // });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      for (let [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);
          activeChats.delete(userId);
          break;
        }
      }
    });
  });
}

module.exports = initSocket;