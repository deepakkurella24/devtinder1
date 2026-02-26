const express=require('express')
const {connectDB}=require('./config/database')
const cors = require('cors')
const cookieParser=require("cookie-parser")
const userAuth=require("./middlewares/userAuth")
const User=require('./models/user')
const Request=require('./models/requests')
const authRoute=require('./routes/authRouter')
const profileRoute=require('./routes/profileRouter')
const requestRoute=require('./routes/requestRouter')
const userRoute=require('./routes/userRouter')
const projectRoute=require('./routes/projectRouter')
const chatRoute=require('./routes/chatRouter');
const app=express();
const http = require("http");
const initSocket = require("./config/socket");

const server = http.createServer(app);



app.use(cors({
  origin: "http://localhost:5173",//allow this frontend
  credentials: true               //takes the jwt from above frontend
}));

//network
// app.use(cors({
//   origin: [
//     "http://localhost:5173",
//     "http://192.168.137.1:5173"  
//   ],
//   credentials: true
// }));


app.use(express.json())
app.use(cookieParser())



app.use(authRoute)
app.use(userAuth)

app.get('/auth/check',(req,res)=>{
    const {
        _id,
        name,
        goal,
        profileURL,
        wanted = [],
        offered = [],
        about = "",
        role=''
        
    } = req.user;

    res.json({isLoggedIn:true,data:{_id,name,profileURL,goal,about,wanted,offered,role}})
})



app.get('/view/:id', async (req, res) => {
  try {
    const user = req.user;
    const reqUserId = req.params.id;

    const reqUser = await User.findById(reqUserId);
    if (!reqUser) throw new Error("user not found");

    const {
      name,
      goal,
      profileURL,
      wanted = [],
      offered = [],
      about = "",
      role = '',
      _id
    } = reqUser;

    let status = 'none';
    let reqId;

    const request = await Request.findOne({
      $or: [
        { toUserId: reqUserId, fromUserId: user._id },
        { toUserId: user._id, fromUserId: reqUserId }
      ]
    });

    if (request) {
      if (request.status === 'pending') {
        if (request.fromUserId.toString() === user._id.toString()) {
          status = 'sent';
        } else {
          status = 'received';
          reqId = request._id;
        }
      } else if (request.status === 'accepted') {
        status = 'accepted';
      }
    }

    res.json({
      data: { _id, role, name, goal, profileURL, wanted, offered, about, status, reqId }
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.use(profileRoute)
app.use(requestRoute)
app.use(userRoute)
app.use(projectRoute)
app.use(chatRoute);




// connectDB().then((res)=>{
//     console.log('DB connected succesfully')
//     app.listen(7777,()=>{
//         console.log('app is running on port 7777')
//     })
    // app.listen(7777, "0.0.0.0", () => {
    // console.log("Server running on network");
    // });
// }).catch((err)=>console.log(err))

connectDB()
  .then(() => {
    console.log("DB connected successfully");

    
    initSocket(server);

    server.listen(7777, () => {
      console.log("app is running on port 7777");
    });
    // server.listen(7777, "0.0.0.0",() => {
    //   console.log("app is running on port 7777");
    // });
  })
  .catch((err) => console.log(err));



