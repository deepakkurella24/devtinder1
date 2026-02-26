const express = require("express");
const router = express.Router();
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const userAuth = require("../middlewares/userAuth");

const mongoose = require("mongoose");

router.get('/chat/details/:conversationId', userAuth, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const currentUserId = req.user._id;


    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send("Invalid Conversation ID");
    }


    const conversation = await Conversation.findById(conversationId)
      .populate("members", "name profileURL role") 
      .lean();

    if (!conversation) {
    //   return res.status(404).send("Conversation not found");
      const reqUser = await User.findById(conversationId);
      if (!reqUser) throw new Error("user not found");
      const {
        
        name,
        profileURL,
        role = '',
        _id
      } = reqUser;
      res.json({
        data: {isGroup: false, id:_id, role, name, profileURL}
      });
      return;
    }


    const isMember = conversation.members.some(
      (member) => member._id.toString() === currentUserId.toString()
    );

    if (!isMember) {
      return res.status(403).send("Access denied. You are not a member of this chat.");
    }

    if (conversation.isGroup) {

      const formattedMembers = conversation.members.map(member => ({
        id: member._id,
        name: member.name,
        profileURL: member.profileURL
      }));

      return res.json({
        data: {
          id:conversationId,
          isGroup: true,
          name: conversation.groupName,
          members: formattedMembers,
          memberCount:formattedMembers.length
        }
      });
    } 
    

    else {

      const otherUser = conversation.members.find(
        (member) => member._id.toString() !== currentUserId.toString()
      );

      if (!otherUser) {
        return res.status(404).send("User no longer exists.");
      }

      return res.json({
        data: {
          isGroup: false,
          id: otherUser._id,
          name: otherUser.name,
          profileURL: otherUser.profileURL,
          role: otherUser.role
        }
      });
    }

  } catch (err) {
    res.status(500).send(err.message);
  }
});


router.post('/chat/create-group', userAuth, async (req, res) => {
  try {
    let { members, groupName } = req.body;
    const currentUserId = req.user._id.toString();

    if (!members.includes(currentUserId)) {
      members.push(currentUserId);
    }

    if (members.length > 5) {
      return res.status(400).send("A group can have a maximum of 5 members.");
    }

    const group = new Conversation({
      members,
      isGroup: true,
      groupName
    });

    await group.save();

    res.status(201).json({ data: group });

  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.put('/chat/group/:conversationId/edit', userAuth, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const currentUserId = req.user._id.toString();
    const { name, members } = req.body; 


    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send("Invalid Conversation ID");
    }

    const group = await Conversation.findById(conversationId);

    if (!group || !group.isGroup) {
      return res.status(404).send("Group not found.");
    }

    const currentMemberStrings = group.members.map(id => id.toString());
    if (!currentMemberStrings.includes(currentUserId)) {
      return res.status(403).send("You must be a member of this group to edit it.");
    }

    if (name && name.trim() !== "") {
      group.groupName = name.trim();
    }

    if (members && Array.isArray(members)) {

      const uniqueMembers = [...new Set(members)];


      if (!uniqueMembers.includes(currentUserId)) {
        uniqueMembers.push(currentUserId);
      }

      if (uniqueMembers.length > 5) {
        return res.status(400).send("A group can have a maximum of 5 members.");
      }

      group.members = uniqueMembers;
    }

    
    await group.save();

  
    await group.populate("members", "name profileURL role");

    res.json({ 
      data: group, 
      message: "Group updated successfully!" 
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put('/chat/group/:conversationId/remove', userAuth, async (req, res) => {
  try {
    const { userIdToRemove } = req.body; 
    const conversationId = req.params.conversationId;
    const currentUserId = req.user._id.toString();

    const group = await Conversation.findById(conversationId);

    if (!group || !group.isGroup) {
      return res.status(404).send("Group not found.");
    }

    const memberStrings = group.members.map(id => id.toString());

    if (!memberStrings.includes(currentUserId)) {
      return res.status(403).send("You must be a member of this group to modify it.");
    }

    if (!memberStrings.includes(userIdToRemove)) {
      return res.status(400).send("That user is not a member of this group.");
    }


    group.members = group.members.filter(id => id.toString() !== userIdToRemove);
    
   
    if (group.members.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);

      return res.json({ message: "Group deleted because it is empty." });
    }

    await group.save();

    res.json({ 
      data: group, 
      message: currentUserId === userIdToRemove ? "You left the group." : "Member removed successfully." 
    });

  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get("/chat/sidebar", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;


    const conversations = await Conversation.find({
      members: userId
    })
      .sort({ updatedAt: -1 })
      .populate("members", "name profileURL role")
      .lean();

    const sidebar = conversations.map((conv) => {
 
      if (conv.isGroup) {
        return {
          id: conv._id, 
          isGroup: true,
          name: conv.groupName || "Unnamed Group",
          avatar: "https://cdn-icons-png.flaticon.com/512/615/615075.png", 
          role: `${conv.members.length} Members`, 
          lastMessage: conv.lastMessage?.text || "",
          time: conv.updatedAt,
          unread: 0,
          online: false 
        };
      } 
      

      else {
        const otherUser = conv.members.find(
          (m) => m._id.toString() !== userId.toString()
        );

        if (!otherUser) return null;

        return {
          id: conv._id, 
          isGroup: false,
          name: otherUser.name,
          avatar: otherUser.profileURL,
          role: otherUser.role,
          lastMessage: conv.lastMessage?.text || "",
          time: conv.updatedAt,
          unread: 0,
          online: false 
        };
      }
    }).filter(item => item !== null);

    res.json({ data: sidebar });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get("/chat/:id", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const targetId = req.params.id; 

    
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).send("Invalid ID");
    }

    
    let conversation = await Conversation.findById(targetId);

    
    if (!conversation) {
      // Prevent self-chat
      if (targetId.toString() === user._id.toString()) {
        return res.status(400).send("Cannot chat with yourself");
      }

     
      // conversation = await Conversation.findOne({
      //   members: { $all: [user._id, targetId] },
      //   isGroup: false
      // });
      conversation = await Conversation.findOne({

        members: { $all: [user._id, targetId] }

      });

    
      if (!conversation) {
        conversation = await Conversation.create({
          members: [user._id, targetId],
          isGroup: false
        });
      }
    }

    const messages = await Message.find({
      conversationId: conversation._id
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name profileURL") 
      .lean();


    const resMessage = messages.map((message) => {
      const isMe = message.senderId._id.toString() === user._id.toString();
      
      return {
        id: message._id, 
        senderId: isMe ? 'me' : message.senderId._id, 
        senderName: isMe ? 'Me' : message.senderId.name, 
        senderAvatar: message.senderId.profileURL,
        text: message.text,
        time: message.createdAt
      };
    });

    res.json({
      conversationId: conversation._id,
      isGroup: conversation.isGroup,
      data: resMessage
    });

  } catch (err) {
    res.status(400).send(err.message);
  }
});


module.exports = router;