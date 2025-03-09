require('dotenv').config()
const User =require('../modeles/user');
const bcrypt=require('bcrypt')
const crypto =require('crypto')
const nodemailer=require('nodemailer');
const twilio=require('twilio');
const { Body } = require('twilio/lib/twiml/MessagingResponse');


const Register=async(req,res)=>{
   try {
     const {username,email,password,image,phone}=req.body;
    if(!username)return res.status(400).json({message:'Username required'});
    if(!email)return res.status(400).json({message:'Email required'});
    if(!password)return res.status(400).json({message:'Password required'});
    if(!phone)return res.status(400).json({message:'Phone number requird'})

    const userExist=await User.findOne({email:email});
    if(userExist) return res.status(200).json({message:'User already exist'});

    const transiporter= await nodemailer.createTransport({
        service:'gmail',
        secure:true,
        auth:{
            user:process.env.EMAIL,
            pass:process.env.EMAIL_PASSWORD
        }
    })

    const generateOpt=crypto.randomInt(100000,999999).toString()
    const otpExpired=new Date(Date.now()+ 60*60*1000)

       await transiporter.sendMail({
        from:process.env.EMAIL,
        to:email,
        subject:'OTP VERIFICATION CODE',
        text:`Verify your email to sign up to our app\n\n ${generateOpt}`
    })

    const client=twilio(process.env.TWILIO_SID,process.env.TWILIO_TOKEN);

    client.messages.create({
        body:`OTP Verification Code ${generateOpt}`,
        from:"+12723469620",
        to:phone
    })
    .then((message)=>console.log('message',message))
    .catch((err)=>console.log('error',err))

    const hashPassword=await bcrypt.hash(password,10);

    const saveUser=await User.create({
        username,
        email,
        password:hashPassword,
        image,
        otp:generateOpt,
        otpExpired,
        phone
    });

 


    res.status(201).json({message:`User registered. Please verify your OTP sent to ${email} and ${phone}.`})
   } catch (error) {
        res.status(500).json({message:"Error to register"});
        console.log('Error to register ',error)
   }
}

const verifyOtp=async(req,res)=>{
   try {
     const {email,otp}=req.body
     if(!email)return res.status(400).json({message:'Email required'})
    const user=await User.findOne({email:email});
    if(!user)return res.status(400).json({message:'User not found'});
    if(!otp) return res.status(400).json({message:'OTP required'})
    if(user.verifyOtp)return res.status(400).json({message:'User already verified'});
    if(user.otp !==otp || user.otpExpired < new Date()) return res.status(400).json({message:"Invalid or expired OTP code"});
    user.otp=undefined;
    user.otpExpired=undefined;
    user.isVerified=true
    await user.save()

    res.status(200).json({message:"Email is verified successfuly. Now you can login"})

   } catch (error) {
        res.status(500).json({message:"Error to verify email"});
        console.log("Error to verify email",error)
   }
}
const resendOtp=async(req,res)=>{
    try {
        const {email} =req.body;
        const user=await User.findOne({email:email});

        if(!user) return res.status(400).json({message:"User not found"});
            if(user.isVerified)return res.status(400).json({message:"User already verified"});

        const generateOpt=crypto.randomInt(100000,999999).toString()
        const otpExpired=new Date(Date.now() + 60*60*1000)

        user.otp=generateOpt,
        user.otpExpired=otpExpired
        await user.save()
        const transiporter= await nodemailer.createTransport({
            service:'gmail',
            secure:true,
            auth:{
                user:process.env.EMAIL,
                pass:process.env.EMAIL_PASSWORD
            }
        })

        await transiporter.sendMail({
            from:process.env.EMAIL,
            to:email,
            subject:'Otp Verification code',
            text:`Verify your new OTP \n\n ${generateOpt}`
        })

        res.status(200).json({message:"OTP resent successfuly"})
    } catch (error) {
        res.status(500).json({message:"Error to resend OTP"});
        console.log("Error to resend OTP",error)
    }
}

const login=async(req,res)=>{
try {
    const {email,password}=req.body;
    if(!email) return res.status(400).json({message:"Email required"});
    if(!password) return res.status(400).json({message:"Password required"});

    const user=await User.findOne({email:email});
    if(!user)return res.status(400).json({message:"Wrong creadetials"});
    

    if(!user.isVerified)return res.status(400).json({message:'Email is not verified. Please verify your OTP'})

    if(!(await bcrypt.compare(password,user.password))) return res.status(400).json({message:'Wrong cresdetials'});

    req.session.user={
        id:user._id,
        email:user.email,
        isAdmin:user.isAdmin,
        username:user.username,
        books:user.booksBorrowed
    }
    console.log(req.session.user) 
    res.status(200).json({message:'Login successfuly'})

} catch (error) {
    res.status(500).json({message:'Error to login'})
    console.log('Error to login',error)
}

}

const lognout=async(req,res)=>{
    try {
        
        req.session.destroy((err)=>{
            if(err)return res.status(500).json({message:'Error to logn out'});
        })
        res.clearCookie('connect.sid');
        res.status(200).json({message:"Logn out successfuly"})

    } catch (error) {
        console.log('Error to logn out ',error)
        return res.status(500).json({message:"Error to logn out"});
    }
}

const dashboard=async(req,res)=>{

    try {
        const user=await User.find({_id:req.session.user.id}).select('username email booksBorrowed phone datetoReturn bookCode').populate('booksBorrowed');

        const returnUser=user.map(user=>({
            Name:user.username,
            Email:user.email,
            Phone:user.phone,
            booksBorrowed:user.booksBorrowed.map(book=>({
                BookId:book._id,
                BookCode:book.bookCode,
                BookName:book.bookTitle,
                Student:book.studentName,
                parentPhone:book.parentPhone,
                DateTaken:book.dateTaken,
                DatetoReturn:book.datetoReturn
            }))
        }))

        res.status(200).json({returnUser})
    } catch (error) {
        
    }
   
}

const updateUser=async(req,res)=>{
   try {
    
        const{username,email,password,phone}=req.body
        const id=req.session.user.id
        if(!id)return res.status(400).json({message:'User id required'});
        const user=await User.findById({_id:id})
        if(!user)return res.status(404).json({message:'User not found'});
        const hashPassword=await bcrypt.hash(password,10)
        let userSave;
        try {
            userSave=await User.findByIdAndUpdate({_id:id},{$set:{username,email,password:hashPassword,phone}},{new:true})
        } catch (error) {
        return res.status(500).json({message:'Error to update user '});
        console.log('Error',error)
        } 
        res.status(200).json({User:userSave})

   } catch (error) {
        return res.status(500).json({message:'Error to update user'});
        console.log('Error to update user',error)
   }
};

const deleteAccount=async(req,res)=>{
    try {
        await User.findByIdAndDelete({_id:req.session.user.id})
        res.clearCookie('connect.sid');
        res.status(200).json({message:"Account deleted successfully"})
    } catch (error) {
        return res.status(500).json({message:'Error to delete account'})
    }
}
module.exports={Register,verifyOtp,resendOtp,login,lognout,dashboard,updateUser,deleteAccount}