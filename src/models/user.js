const mongoose=require('mongoose')
const validater=require('validator')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        trim:true,
        minlength: 3,
        maxlength: 20,
        required: [true, 'FirstName is required'],
        
    },
    lastName: {
        type:String,
        maxlength: 20,
        trim:true
    },
    email: {
        type:String,
        required: [true, 'email is required'],
        unique: true,
        lowercase:true,
        trim:true,
        validate(value){
            if(!validater.isEmail(value)){
                throw new Error('invalid email')
            }
        }
        
    },
    password: {
        type:String,
        required: [true, 'password is required'],
    },
},  
{
    timestamps: true
})

userSchema.methods.getJWT=function(){
    const user=this
    return jwt.sign({_id:user._id},"deepakKurella@123",{expiresIn:'7d'})
}

userSchema.methods.validatePasswordFromDB=function(password){
    const user=this
    return bcrypt.compare(password,user.password)
}


module.exports=mongoose.model('User',userSchema)

// {   
//     firstName:'deepak',
//     lastName:'kurella',
//     email:'deepak.kurella24@sasi.ac.in',
//     password:'helloworld@123'
// }