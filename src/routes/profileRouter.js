const express=require('express');
const router = express.Router();
const { isStrongPassword } = require('validator');
const User=require('../models/user')
const bcrypt = require('bcrypt');

function validateForm(name, role, bio, wanted, offered, goal) {
  if (!name || name.trim().length < 3) throw new Error("Name must be at least 3 characters");
  if (name.length > 30) throw new Error("Name cannot exceed 30 characters");
  
  if (!role || role.trim().length < 3) throw new Error("Role must be at least 3 characters");
  if (role.length > 20)  throw new Error("Role cannot exceed 20 characters");

  if (!bio || bio.trim().length < 10) throw new Error("Bio must be at least 10 characters");
  if (bio.length > 150)  throw new Error("Bio cannot exceed 150 characters");

  if (!goal || goal.trim().length < 5) throw new Error("Goal must be at least 5 characters");
  if (goal.length > 80) throw new Error("Goal cannot exceed 80 characters");

  
  for (const item of offered) {
    if (wanted.includes(item)) throw new Error(`"${item}" cannot be in both Offered and Wanted`);
  }
}

function validatePassword(value){
    if(!isStrongPassword(value)){
        throw new Error('invalid password')
    }
}

router.patch('/profile/edit',async(req,res)=>{
    try{
        let user=req.user
        let updatedValues=req.body
        // const {name, role, about, wanted, offered, goal}=updatedValues
        validateForm(updatedValues.name,updatedValues.role,updatedValues.about,updatedValues.wanted,updatedValues.offered,updatedValues.goal)
        user.name=updatedValues.name
        user.role=updatedValues.role
        user.profileURL=updatedValues.profileURL
        user.about=updatedValues.about
        user.offered=updatedValues.offered
        user.wanted=updatedValues.wanted
        user.goal=updatedValues.goal;
        let a=await user.save()
        const {
            name,
            goal,
            profileURL,
            wanted = [],
            offered = [],
            about = "",
            role=''
        } = a;
        // console.log(a)
        res.json({data:{name,profileURL,goal,about,wanted,offered,role},message:"successfully updated"})
    }catch(err){
        res.status(401).send(err.message)
    }
})

router.patch("/profile/change-password",async(req,res)=>{
    try{
        const {password,newPassword}=req.body;
        const user=req.user
        const isValidPassword=user.validatePasswordFromDB(password)
        if(!isValidPassword) throw new Error("incorrect password")
        validatePassword(newPassword);
        const hashPassword=await bcrypt.hash(newPassword, 10);
        user.password=hashPassword
        const updatedUser= await user.save()
        //const updatedUser= await User.findByIdAndUpdate(user._id,{ $set: { password:hashPassword } },{ new: true });
        res.send(updatedUser)
    }catch(err){
        res.status(401).send(err.message)
    }
})

router.get("/profile",async(req,res)=>{
    try{

        res.send(req.user)
    }catch(err){
        res.status(401).send(err.message)
    }
})

module.exports=router
