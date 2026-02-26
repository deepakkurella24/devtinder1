const express=require('express')
const router = express.Router();
const User=require('../models/user')
const bcrypt = require('bcrypt');
const validater=require('validator')
const jwt = require('jsonwebtoken');
// const { appendFile } = require('fs');
function validatePassword(value){
    if(!validater.isStrongPassword(value)){
        throw new Error('invalid password')
    }
}

router.post('/auth/signUp',async (req,res)=>{ 
    try{
        
        const userData=await User.exists({email:req.body.email})
        
        
        if(userData){
            //console.log('email already used')
            throw new Error('email already used')
        }
        const {email,name,password}=req.body
        validatePassword(password)
        const hashPassword=await bcrypt.hash(password, 10);
       
        const user=new User({name,email,password:hashPassword})
        
        await user.save();
        //console.log(userData);
        console.log('user added successfully')
        res.send('added succesfully')
    
    }catch(err){
        res.status(401).send({error:err.message})
    }
})

router.post('/auth/logIn',async (req,res)=>{
    try{
        const {email,password}=req.body;
        // console.log(_id)
        const user=await User.findOne({email})
        if(!user)  throw new Error('invalid user')
        const bool=await user.validatePasswordFromDB(password)
        if(!bool) throw new Error('incorrect password')
        const jwtToken=await user.getJWT()
        res.cookie('token',jwtToken, {
            httpOnly: true,      //makes not to read jwt with javascript operations
            secure: false,       // no HTTPS 
            sameSite: "Lax",     // Works for localhost (both frontend and backend running on same laptop on dev)
            maxAge: 24 * 60 * 60 * 1000
        })
        //network
        // res.cookie('token', jwtToken, {
        //     httpOnly: true,
        //     secure: false,        // true only if HTTPS
        //     sameSite: "None",     // IMPORTANT for different devices
        //     maxAge: 24 * 60 * 60 * 1000
        // });
        const {
            _id,
            name,
            goal,
            profileURL,
            wanted = [],
            offered = [],
            about = "",
            role=''
            
        } = user;
        res.json({isLoggedIn:true,data:{_id,name,profileURL,goal,about,wanted,offered,role}})

    }catch(err){
        res.status(401).send({error:err.message})
    }
})

router.post('/auth/logOut',async (req,res)=>{
    res.cookie('token',null,{expires:new Date(0)})
    res.send('logged out succesfully')
})




module.exports=router
