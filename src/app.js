const express=require('express')
const {connectDB}=require('./config/database')
const User=require('./models/user')
const app=express();
app.use(express.json())

app.post('/signUp',async (req,res)=>{
    const user=new User(req.body)
    // {
        // firstName:'deepak',
        // lastName:'kurella',
        // email:'deepak.kurella24@sasi.ac.in',
        // password:'helloworld@123'
    // }
    await user.save();
    console.log('user added successfully')
    res.send('added succesfully')
})

connectDB().then((res)=>{
    console.log('DB connected succesfully')
    app.listen(7777,()=>{
        console.log('app is running on port 7777')
    })
}).catch((err)=>console.log(err))





