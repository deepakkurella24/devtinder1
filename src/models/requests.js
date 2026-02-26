const mongoose=require('mongoose')


const RequestSchema = new mongoose.Schema({
    fromUserId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"from user id is required"],
        ref:'User'
        
    },
    toUserId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"from user id is required"],
        ref:'User'
    },
    status:{
        type:String,
        enum:{
            values: ['pending','accepted','rejected','remove'],
            message: '{VALUE} is not a valid status'
        }
    },
    rejectedOneReSentOn: {
        type: [Date],
        default: []
    }
},{timestamps:true})

RequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true }
);

module.exports=mongoose.model('Requests',RequestSchema)
