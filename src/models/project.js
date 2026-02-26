// models/Project.js
const mongoose = require("mongoose");
const validater=require('validator')

const projectSchema = new mongoose.Schema({
  // title: {
  //   type: String,
  //   required: true
  // },
  // role:{
  //   type:String,
  //   trim:true
  // },
  description: {
    type:String,
    trim:true,
    required: true
  },
  techStack:{ 
    type:[String],
    required: true
  },
  projectURL: {
    type:String,
    trim:true,
    // validate(value){
    //     if(!validater.isURL(value)){
    //         throw new Error('invalid project url')
    //     }
    // }
  },
  gitHubURL:{
    type:String,
    trim:true,
    // validate(value){
    //     if(!validater.isURL(value)){
    //         throw new Error('invalid github url')
    //     }
    // }
  },
  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  projectImgURL:{
    type:String,
    required: true
    // validate(value){
    //     if(!validater.isURL(value)){
    //         throw new Error('invalid url')
    //     }
    // }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema); 