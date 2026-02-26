const express=require('express');
const Request=require('../models/requests')
const User=require('../models/user');
const { Connection } = require('mongoose');
const route=express.Router();

// route.get('/user/requests',async(req,res)=>{
//     try{
//         const user=req.user;
//         const requests=await Request.find({toUserId:user._id,status:'pending'}).populate('fromUserId',[ 'name','profileURL','role','wanted','offered' ])


//         const resRequests=requests.map((req)=>{
//             const matches=[]
//             user.wanted.forEach((skill)=>{
//                 // if(req.wanted.includes(skill)) matches.push(skill);
//                 if(req.offered.includes(skill)) matches.push(skill);
//             })
//             user.offered.forEach((skill)=>{
//                 if(req.wanted.includes(skill)) matches.push(skill);
//                 // if(req.offered.includes(skill)) matches.push(skill);
//             })

//             return {name:req.name,profileURL:req.profileURL,role:req.role,matches:[...new Set(matches)]}
//         })

//         res.json({message:"request succesfully excecuted",data:resRequests})

//     }
//     catch(err){
//         res.status(400).send(err.message)
//     }
// })



route.get('/user/requests', async (req, res) => {
  try {
    const user = req.user;

    const requests = await Request.find({
      toUserId: user._id,
      status: 'pending'
    }).populate('fromUserId', ['name', 'profileURL', 'role', 'wanted', 'offered']);

    const resRequests = requests.map((reqDoc) => {
      const sender = reqDoc.fromUserId;
      if (!sender) return null; 

      const matches = [];


      user.wanted.forEach((skill) => {
        if (sender.offered.includes(skill)) matches.push(skill);
      });


      user.offered.forEach((skill) => {
        if (sender.wanted.includes(skill)) matches.push(skill);
      });

      return {
        _id:reqDoc._id,
        name: sender.name,
        profileURL: sender.profileURL,
        role: sender.role,
        matches: [...new Set(matches)],
        time:reqDoc.createdAt
      };
    }).filter(Boolean);

    res.json({
      message: "request successfully executed",
      data: resRequests
    });

  } catch (err) {
    res.status(400).send(err.message);
  }
});


route.get('/user/sent',async(req,res)=>{
    try{
        const user=req.user;
        const requests=await Request.find({fromUserId:user._id,status:'pending'}).populate('toUserId',[ 'name','profileURL','role','wanted','offered' ]);
        res.json({message:"request succesfully excecuted",data:requests});

    }
    catch(err){
        res.status(400).send(err.message)
    }
})

route.get('/user/connections',async(req,res)=>{
    try{
        const user=req.user;
        const connections=await Request.find({
            $or: [
                { toUserId:user._id,status:'accepted' },
                { fromUserId:user._id,status:'accepted' }
            ]
        }).populate('fromUserId',[ 'name','profileURL','role','wanted','offered' ]).populate('toUserId',[ 'name','profileURL','role','wanted','offered' ]);
        const resData=connections.map((con)=>{
            if(user._id.toString()===con.toUserId._id.toString()) return con.fromUserId;
            else return con.toUserId;
        })
        res.json({status:"succsess",data:resData})
    }
    catch(err){
        res.status(400).send(err.message)
    }
})

route.get('/user/feed',async(req,res)=>{
    try{
        const user=req.user;
        const page=req.query.page || 1;
        const limit=req.query.limit || 10;
        const skip=(page-1)*limit;
        const connections=await Request.find({
            $or: [
                { toUserId:user._id },
                { fromUserId:user._id}
            ]
        }).select('fromUserId toUserId')
        //console.log(connections)
        const connectionSet=new Set();
        connections.forEach((connection)=>{
            connectionSet.add(connection.toUserId);
            connectionSet.add(connection.fromUserId);
        })
        const feedUsers=await User.find({
            // $and:[
            //     {_id:{$nin:[...connectionSet]}},
            //     {_id:{$ne:user._id}},
            //     { offered: { $in: user.wanted } }
            // ]
            $and: [
                { _id: { $nin: [...connectionSet] } },
                { _id: { $ne: user._id } },
                {
                $or: [
                    { offered: { $in: user.wanted } }, // they teach what I want
                    { wanted: { $in: user.offered } }  // they want what I teach
                ]
                }
            ]
           
        }).select({name:1,offered:1,wanted:1,profileURL:1,about:1,role:1,goal:1}).skip(skip).limit(limit+1)
        let hasMore=false;
        if(feedUsers.length>limit){
            hasMore=true;
            feedUsers.pop();
        }

        const resFeedUsers=feedUsers.map((user)=>{
            // user.showReqButton=true;
            const {_id,name,profileURL,offered,wanted,goal,role}=user;
            return {_id,name,profileURL,offered,wanted,goal,role,status:'none'};
        })
        //console.log(resFeedUsers)

        res.json({status:'succsess',data:resFeedUsers,hasMore})
    }
    catch(err){
        res.status(400).send(err.message)
    }
})


route.get("/user/search", async (req, res) => {
  try {
    const user = req.user;
    const q = req.query.q || "";

   
    const users = await User.find({
      _id: { $ne: user._id },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { offered: { $regex: q, $options: "i" } },
        { wanted: { $regex: q, $options: "i" } }
      ]
    }).select("name profileURL role offered wanted goal");

    
    const requests = await Request.find({
      $or: [
        { fromUserId: user._id },
        { toUserId: user._id }
      ]
    });

    const requestMap = new Map();

    requests.forEach((r) => {
      if (r.fromUserId.toString() === user._id.toString()) {
        requestMap.set(r.toUserId.toString(), {
          status: r.status, 
          direction: "sent"
        });
      } else {
        requestMap.set(r.fromUserId.toString(), {
          status: r.status,
          direction: "received",
          requestId: r._id
        });
      }
    });

    
    const finalUsers = users.map((u) => {
      const relation = requestMap.get(u._id.toString());

      if (!relation) {
        return { ...u.toObject(), status: "none" };
      }

      if (relation.status === "accepted") {
        return { ...u.toObject(), status: "accepted" };
      }

      if (relation.direction === "sent" && relation.status !=='rejected' ) {
        return { ...u.toObject(), status: "sent" };
      }

      if (relation.direction === "received" && relation.status !=='remove' ) {
        return { ...u.toObject(), status: "received",requestId:relation.requestId };
      }

      return { ...u.toObject(), status: "none" };
    });

    res.json({ data: finalUsers });

  } catch (err) {
    res.status(400).send(err.message);
  }
});


route.get("/user/search-suggestion",async(req,res)=>{
  try{
    const q=req.query.q.trim();
    const user=req.user
    const users = await User.find({
      _id: { $ne: user._id },
      $or: [
        { name: { $regex: q, $options: "i" } },
      ]
    }).select("name profileURL");
    // const users=await Connection.find({
    //   $or: [
    //       { toUserId:user._id,status:'accepted' },
    //       { fromUserId:user._id,status:'accepted' }
    //   ]
    // })
    res.json({data:[q,users]})
  } 
  catch (err) {
    res.status(400).send(err.message);
  }
})



route.get("/user/search-suggestion-connections" , async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : "";
    const user = req.user;

    const connections = await Request.find({
      $or: [
        { toUserId: user._id, status: 'accepted' },
        { fromUserId: user._id, status: 'accepted' }
      ]
    });

    const connectedUserIds = connections.map(conn => {

      return conn.fromUserId.toString() === user._id.toString() 
        ? conn.toUserId 
        : conn.fromUserId;
    });


    const matchedUsers = await User.find({
      _id: { $in: connectedUserIds },          
      name: { $regex: q, $options: "i" }      
    })
    .select("name profileURL _id")        
    .limit(10);                               

    res.json({ data:[ q,matchedUsers] });

  } catch (err) {
    res.status(400).send(err.message);
  }
});


route.get("/user/names-skills-suggetion", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const user = req.user;

    if (!q) return res.json({ data: [q,[]] });

    const regex = new RegExp(`\\b\\w*${q}\\w*\\b`, "i");

    const users = await User.find({
      _id: { $ne: user._id },
      $or: [
        { name: { $regex: regex } },
        { offered: { $regex: regex } },
        { wanted: { $regex: regex } }
      ]
    })
      .select("name profileURL offered wanted")
      .limit(10);

    const suggestions = [];

   
    const normalize = (field) => {
      if (Array.isArray(field)) return field;
      if (typeof field === "string") return field.split(/\s+/);
      return [];
    };

    users.forEach((u) => {
 
      if (u.name && regex.test(u.name)) {
        suggestions.push({
          type: "name",
          value: u.name,
          profileURL: u.profileURL
        });
      }


      normalize(u.offered).forEach((skill) => {
        if (regex.test(skill)) {
          suggestions.push({
            type: "skill",
            value: skill
          });
        }
      });

      normalize(u.wanted).forEach((skill) => {
        if (regex.test(skill)) {
          suggestions.push({
            type: "skill",
            value: skill
          });
        }
      });
    });

    const unique = Array.from(
      new Map(suggestions.map((s) => [s.value.toLowerCase(), s])).values()
    ).slice(0, 6);

    res.json({ data:[ q,unique ]});
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports=route