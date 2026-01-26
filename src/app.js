const express=require('express')
const {connectDB}=require('./config/database')
const User=require('./models/user')
const bcrypt = require('bcrypt');
const validater=require('validator')
const jwt = require('jsonwebtoken');
const cookieParser=require("cookie-parser")
const userAuth=require("./middlewares/userAuth")
const app=express();
function validatePassword(value){
    if(!validater.isStrongPassword(value)){
        throw new Error('invalid password')
    }
}
app.use(express.json())
app.use(cookieParser())




app.post('/signUp',async (req,res)=>{
    try{
        
        const userData=await User.exists({email:req.body.email})
        
        
        if(userData){
            //console.log('email already used')
            throw new Error('email already used')
        }
        const {email,firstName,lastName,password}=req.body
        validatePassword(password)
        const hashPassword=await bcrypt.hash(password, 10);
       
        const user=new User({firstName,lastName,email,password:hashPassword})
        
        await user.save();
        //console.log(userData);
        console.log('user added successfully')
        res.send('added succesfully')
    
    }catch(err){
        res.status(401).send(err.message)
    }
})

app.post('/logIn',async (req,res)=>{
    try{
        const {email,password}=req.body;
        // console.log(_id)
        const user=await User.findOne({email})
        if(!user)  throw new Error('invalid user')
        const bool=await user.validatePasswordFromDB(password)
        if(!bool) throw new Error('incorrect password')
        const jwtToken=await user.getJWT()
        res.cookie('token',jwtToken)
        res.send({firstName:user.firstName,lastName:user.lastName});

    }catch(err){
        res.status(401).send(err.message)
    }
})

app.use('/',userAuth)

app.get("/",async(req,res)=>{
    try{

        res.send(req.body)
    }catch(err){
        res.status(401).send(err.message)
    }
})




connectDB().then((res)=>{
    console.log('DB connected succesfully')
    app.listen(7777,()=>{
        console.log('app is running on port 7777')
    })
}).catch((err)=>console.log(err))





