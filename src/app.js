const express=require('express')
const {connectDB}=require('./config/database')
const app=express();


connectDB().then((res)=>{
    console.log('DB connected succesfully')
    app.listen(7777,()=>{
        console.log('app is running on port 7777')
    })
}).catch((err)=>console.log(err))





