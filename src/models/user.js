const mongoose=require('mongoose')
const validater=require('validator')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        minlength: 3,
        maxlength: 30,
        required: [true, 'FirstName is required'],
        
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

    profileURL:{
        type:String,
        default:"https://geographyandyou.com/images/user-profile.png",
        validate(value){
            if(!validater.isURL(value)){
                throw new Error('invalid url')
            }
        }
    },
    about:{
        type:String,
        trim:true,
        minlength:10,
        maxlength:150,
        // required: [true, 'about is required'],
    },
    offered:{
        type:[String],
       
    },
    wanted:{
        type:[String]
    },
    goal:{
        type:String,
        trim:true,
        minlength:5,
        maxlength:80,
        trim:true,
        default:"To gain practical knowledge and apply this skill in real-world projects"
    },
    role:{
        type:String,
        trim:true,
        minlength:3,
        maxlength:30
    }
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
// } age,gender,profileUrl,about,skills