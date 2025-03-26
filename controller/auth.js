require('dotenv').config()
const User =require('../modeles/user');
const bcrypt=require('bcrypt')
const crypto =require('crypto')
const nodemailer=require('nodemailer');
const twilio=require('twilio');
const {addMinutes}=require('date-fns')
const {addHours}=require('date-fns')
const {randomBytes}=require('crypto')
const {validationResult}=require('express-validator')


const Register=async(req,res,next)=>{
   try {

    const errors=validationResult(req);

    if(!errors.isEmpty()){
      const formatError=errors.array().map(err=>({
        message:err.msg
      }))
      return res.status(400).json({error:formatError})
    }
      const{email,username,password,image,phone}=req.body;

     transiporter= await nodemailer.createTransport({
        service:'gmail',
        secure:true,
        auth:{
            user:process.env.EMAIL,
            pass:process.env.EMAIL_PASSWORD
        }
    })

    const generateOpt=crypto.randomInt(100000,999999).toString()
    const currentDate=new Date()
    const otpExpired=addMinutes(currentDate,15);

       await transiporter.sendMail({
        from:process.env.EMAIL,
        to:email,
        subject:'OTP VERIFICATION CODE',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Email</title>
           <link href="	https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <!-- Header -->
                  <div style="background-color: #4A90E2; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Welcome to Our Service</h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 24px; line-height: 1.6;">
                    <p style="margin-top: 0; color: #333333; font-size: 16px;">Hello ${username},</p>
                    
                    <p style="color: #333333; font-size: 16px;">Thank you for signing up! We're excited to have you on board.</p>
                    
                    <p style="color: #333333; font-size: 16px;">Here are verification code to help you get started this code expired in 15 minutes:</p>
                    
                   
                    
                    <div style="margin: 30px 0; text-align: center;">
                      <h1 style="background-color: #4A90E2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">${generateOpt}</h1>
                    </div>
                    
                    <p style="color: #333333; font-size: 16px;">If you have any questions, just reply to this email. We're always here to help!</p>
                    
                    <p style="color: #333333; font-size: 16px;">Best regards,<br>Merci RUYANGA</p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f4f4f4; padding: 24px; text-align: center;">
                    <p style="margin: 0; color: #777777; font-size: 14px;">
                      © 2025 Your Company. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0; color: #777777; font-size: 14px;">
                      <a href="#" style="color: #777777; text-decoration: underline;">Unsubscribe</a> |
                      <a href="#" style="color: #777777; text-decoration: underline;">Privacy Policy</a>
                    </p>
                    <div style="margin-top: 20px;">
                      <a href="https://www.facebook.com/ruyanga.merci.1" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                      
                        <i class="bi bi-facebook"></i>
                      </a>
                      <a href="https://x.com/RuyangaM" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                        <i class="bi bi-twitter-x"></i>
                      </a>
                      <a href="https://github.com/RUYANGA" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                        <i class="bi bi-github"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </table>
           <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
      `
    });

    // const client=twilio(process.env.TWILIO_SID,process.env.TWILIO_TOKEN);

    // client.messages.create({
    //     body:`OTP Verification Code ${generateOpt}`,
    //     from:"+12723469620",
    //     to:phone
    // })
    // .then((message)=>console.log('message',message))
    // .catch((err)=>next( new Error(err)))

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

    res.status(201).json({message:`User registered. Please verify your OTP sent to ${email} and ${phone}.`});

   } catch (error) {

        const errors= new Error(error);
        errors.statusCode=500
        return next(errors)
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

      const errors= new Error(error);
      errors.statusCode=500;
      return next(errors);
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
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome Email</title>
               <link href="	https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                      <!-- Header -->
                      <div style="background-color: #4A90E2; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Welcome to Our Service</h1>
                      </div>
                      
                      <!-- Content -->
                      <div style="padding: 24px; line-height: 1.6;">
                        <p style="margin-top: 0; color: #333333; font-size: 16px;">Hello ${user.username},</p>
                        
                        <p style="color: #333333; font-size: 16px;">Thank you for signing up! We're excited to have you on board.</p>
                        
                        <p style="color: #333333; font-size: 16px;">Here are verification code to help you get started this code expired in 15 minutes:</p>
                        
                       
                        
                        <div style="margin: 30px 0; text-align: center;">
                          <h1 style="background-color: #4A90E2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">${generateOpt}</h1>
                        </div>
                        
                        <p style="color: #333333; font-size: 16px;">If you have any questions, just reply to this email. We're always here to help!</p>
                        
                        <p style="color: #333333; font-size: 16px;">Best regards,<br>Merci RUYANGA</p>
                      </div>
                      
                      <!-- Footer -->
                      <div style="background-color: #f4f4f4; padding: 24px; text-align: center;">
                        <p style="margin: 0; color: #777777; font-size: 14px;">
                          © 2025 Your Company. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0; color: #777777; font-size: 14px;">
                          <a href="#" style="color: #777777; text-decoration: underline;">Unsubscribe</a> |
                          <a href="#" style="color: #777777; text-decoration: underline;">Privacy Policy</a>
                        </p>
                        <div style="margin-top: 20px;">
                          <a href="https://www.facebook.com/ruyanga.merci.1" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                          
                            <i class="bi bi-facebook"></i>
                          </a>
                          <a href="https://x.com/RuyangaM" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                            <i class="bi bi-twitter-x"></i>
                          </a>
                          <a href="https://github.com/RUYANGA" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                            <i class="bi bi-github"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
               <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
            </body>
            </html>
          `
        })

        res.status(200).json({message:"OTP resent successfuly"})
    } catch (error) {

        const errors= new Error(error);
        errors.statusCode=500;
        return next(errors);
    }
}

const login=async(req,res)=>{
try {
    const errors=validationResult(req);

    if(!errors.isEmpty()){
      const formatError=errors.array()[0].map(err=>({
        message:err.msg
      }))
      return res.status(400).json({error:formatError})
    }

    const {email,password}=req.body;
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
    //console.log(req.session.user) 
    res.status(200).json({message:'Login successfuly'})

} catch (error) {

    const errors= new Error(error);
    errors.statusCode=500;
    return next(errors);
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

      const errors= new Error(error);
      errors.statusCode=500;
      return next(errors);
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

      const errors= new Error(error);
      errors.statusCode=500;
      return next(errors);
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

      const errors= new Error(error);
      errors.statusCode=500;
      return next(errors);
   }
};

const forgetPassword=async(req,res)=>{
 try {
  const {email}=req.body;
  if(!email) return res.status(400).json({message:"Email required"});
  const token=randomBytes(32).toString('hex');
  const user= await User.findOne({email:email});
  if(!user) return res.status(404).json({message:"User with password not found"});


  transiporter= await nodemailer.createTransport({
    service:'gmail',
    secure:true,
    auth:{
        user:process.env.EMAIL,
        pass:process.env.EMAIL_PASSWORD
    }
  });
  await transiporter.sendMail({
    from:process.env.EMAIL,
    to:email,
    subject:'Reset Password',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome Email</title>
       <link href="	https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #4A90E2; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Welcome to Our Service</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 24px; line-height: 1.6;">
                <p style="margin-top: 0; color: #333333; font-size: 16px;">Hello ${user.username},</p>
                
                <p style="color: #333333; font-size: 16px;">Thank you for using our app! We're excited to have you on board.</p>
                
                <p style="color: #333333; font-size: 16px;">Here are link to help you get reset password this link expired in 1 hour:</p>
                
               
                
                <div style="margin: 30px 0; text-align: center;">
                  <h1 style=" color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;"><a href='http://localhost:2000/reset-password/${token}'>Reset password</a></h1>
                </div>
                
                <p style="color: #333333; font-size: 16px;">If you have any questions, just reply to this email. We're always here to help!</p>
                
                <p style="color: #333333; font-size: 16px;">Best regards,<br>Merci RUYANGA</p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f4f4f4; padding: 24px; text-align: center;">
                <p style="margin: 0; color: #777777; font-size: 14px;">
                  © 2025 Your Company. All rights reserved.
                </p>
                <p style="margin: 10px 0 0; color: #777777; font-size: 14px;">
                  <a href="#" style="color: #777777; text-decoration: underline;">Unsubscribe</a> |
                  <a href="#" style="color: #777777; text-decoration: underline;">Privacy Policy</a>
                </p>
                <div style="margin-top: 20px;">
                  <a href="https://www.facebook.com/ruyanga.merci.1" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                  
                    <i class="bi bi-facebook"></i>
                  </a>
                  <a href="https://x.com/RuyangaM" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                    <i class="bi bi-twitter-x"></i>
                  </a>
                  <a href="https://github.com/RUYANGA" style="display: inline-block; margin: 0 10px; color: #4A90E2;">
                    <i class="bi bi-github"></i>
                  </a>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
       <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `
  });
  const currentDate=new Date()
  const tokenExpired=addHours(currentDate,1)
  user.token=token;
  user.tokenExpired=tokenExpired;
  await user.save()
  res.status(200).json({message:`Reset link sent to ${user.email}`})
  
 } catch (error) {
    const errors= new Error(error);
    errors.statusCode=500;
    return next(errors);
 }  
};


const resetPassword=async(req,res)=>{
 try {
  const {email,password}=req.body;
  const token=req.params.token;
  const current=new Date();
  if(!password)return res.status(400).json({message:'Password required'})
  const user=await User.findOne({email:email});
  if(!user)return res.status(404).json({message:'User with email not found!'});
  if(user.tokenExpired < current || user.token !==token )return res.status(404).json({message:'Token is invalid or expired'});

  const hashPassword=await bcrypt.hash(password,12);
  user.token=null;
  user.tokenExpired=null;
  user.password=hashPassword;
  await user.save();

  res.status(201).json({message:'Reset password successfuly!, now you can login'});

 } catch (error) {

    const errors= new Error(error);
    errors.statusCode=500;
    return next(errors);
 }
};

const deleteAccount=async(req,res)=>{
    try {
        await User.findByIdAndDelete({_id:req.session.user.id})
        res.clearCookie('connect.sid');
        res.status(301).json({message:"Account deleted successfully"})
    } catch (error) {

      const errors= new Error(error);
      errors.statusCode=500;
      return next(errors);
    }
}
module.exports={Register,verifyOtp,resendOtp,login,lognout,dashboard,updateUser,deleteAccount,forgetPassword,resetPassword}