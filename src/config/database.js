const mongoose=require('mongoose')

const connectDB=async()=>{
    return await mongoose.connect('mongodb+srv://deepakkurella24_db_user:8NmoQuLwge3oWwaN@firstproject.1rilbsw.mongodb.net/DevTinder');
}
module.exports={connectDB}