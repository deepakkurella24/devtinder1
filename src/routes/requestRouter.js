const express=require('express');
const router = express.Router();
const Request=require('../models/requests')
const User=require('../models/user')
const mongoose=require('mongoose') 

router.post('/request/cancel/:userId',async(req,res)=>{
    try{
        const user=req.user;
        const toUserId=req.params.userId;
        const fromUserId=user._id;
        if(toUserId.toString() === fromUserId.toString()) throw new Error("from id and to id are same")
        if (!mongoose.Types.ObjectId.isValid(toUserId)) throw new Error('invalid user id');
        const userExistance=await User.exists({_id:toUserId})
        if(!userExistance) throw new Error("invalid to user")
        const request=await Request.findOne({ toUserId,fromUserId });
        if(!request) throw new Error('no request found');
        if (request.status === 'accepted' || request.status === 'rejected'  )  throw new Error('request cannot be canceled');
        await Request.deleteOne({ _id: request._id });
        res.json({message:'cancelled succesfully'})

    }catch(err){
        res.status(400).send(err.message)
    }
})

router.post('/request/send/:userId', async (req, res) => {
  try {
    const user = req.user;
    const toUserId = req.params.userId;
    const fromUserId = user._id;

    if (toUserId.toString() === fromUserId.toString())
      throw new Error("from id and to id are same");

    if (!mongoose.Types.ObjectId.isValid(toUserId))
      throw new Error('invalid user id');

    const userExistence = await User.exists({ _id: toUserId });
    if (!userExistence) throw new Error("invalid to user");

    const request = await Request.findOne({
      $or: [
        { toUserId, fromUserId },
        { toUserId: fromUserId, fromUserId: toUserId }
      ]
    });

    if (request) {
      if (request.status === 'accepted')
        throw new Error('You are already connected');

      if (request.status === 'pending')
        throw new Error('Request already pending');

      if (request.status === 'rejected') {
        request.status = 'pending';
        request.rejectedOneReSentOn = request.rejectedOneReSentOn || [];
        request.rejectedOneReSentOn.push(new Date());
        await request.save();
        return res.json({ message: "Request re-sent successfully" });
      }
    }

    const newRequest = new Request({
      fromUserId,
      toUserId,
      status: 'pending'
    });

    await newRequest.save();

    res.json({ message: "Request sent successfully" });

  } catch (err) {
    res.status(400).send(err.message);
  }
});



router.post('/request/remove/:userId', async (req, res) => {
  try {
    const user = req.user;
    const toUserId = req.params.userId;
    const fromUserId = user._id;

    if (toUserId.toString() === fromUserId.toString())
      throw new Error("from id and to id are same");

    if (!mongoose.Types.ObjectId.isValid(toUserId))
      throw new Error('invalid user id');

    const userExistence = await User.exists({ _id: toUserId });
    if (!userExistence) throw new Error("invalid to user");

    const request = await Request.findOne({
      $or: [
        { toUserId, fromUserId, status: "accepted" },
        { toUserId: fromUserId, fromUserId: toUserId, status: "accepted" }
      ]
    });

    if (!request) {
      throw new Error("No active connection found");
    }

    
    request.status = "remove";
    await request.save();

    res.json({ message: "User successfully removed" });

  } catch (err) {
    res.status(400).send(err.message);
  }
});




router.post('/request/review/:status/:requestId',async(req,res)=>{
    try{
        const {requestId,status}=req.params;
        const user=req.user;
        if (!mongoose.Types.ObjectId.isValid(requestId)) throw new Error('invalid request id');
        if(!['accepted','rejected'].includes(status)) throw new Error("invalid status");
        const request=await Request.findOne({_id:requestId,toUserId:user._id ,status:'pending'});
        if(!request) throw new Error("invalid request");
        request.status=status
        const updatedRequest=await request.save()
        res.json({message:"request successful",data:updatedRequest})
    }
    catch(err){
        res.status(400).send(err.message)
    }
})


module.exports=router

//toUserId.toString() === fromUserId.toString()