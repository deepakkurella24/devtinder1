const mongoose=require('mongoose')

const connectDB=async()=>{
    return await mongoose.connect(process.env.MONGO_URL);
}
module.exports={connectDB}