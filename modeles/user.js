const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:Number,
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    password:{
        type:String,
        required:true
    },
    booksBorrowed:[],
    image:{
        type:String
    },
    otp:{
        type:String
    },
    otpExpired:{
        type:Date
    },
    isVerified:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

module.exports=mongoose.model('User',userSchema)