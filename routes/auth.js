const router=require('express').Router();
const { unauthrized ,Admin}=require('../middleware/authMiddleware')
const { Register, login, verifyOtp, resendOtp, lognout, dashboard, updateUser, deleteAccount, forgetPassword, resetPassword }=require('../controller/auth');
const {body}=require('express-validator');
const User=require('../modeles/user')


router.post('/register',[
    body('username')
    .notEmpty()
    .toUpperCase()
    .withMessage('Username is required'),
    body('email')
    .notEmpty()
    .custom((value,{req})=>{
       return User.findOne({email:value})
        .then(user=>{
            if(user){
                return Promise.reject(
                    'Email taken choose another one'
                )
            }
        })
    })
    .isEmail()
    .toLowerCase()
    .normalizeEmail()
    .trim()
    .withMessage('Email is not valid format'),
    body('password')
    .notEmpty()
    .withMessage('Password required')
    .isStrongPassword()
    .trim()
    .withMessage('Password must be contain capital & lower character , number , symbol and 8 length'),
    body('phone')
    .notEmpty()
    .isNumeric()
    .withMessage('Phone must be the numbers')
    .isLength({min:13, max:13})
    .withMessage('provide valid phone number format')

],
    Register);


router.post('/login',[
    body('email')
    .notEmpty()
    .toLowerCase()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter valid email format'),
    body('password')
    .notEmpty()
    .toLowerCase()
    .trim()
    .withMessage('Password required')

],
    login);


router.post('/verifyotp',verifyOtp);
router.post('/resendotp',resendOtp);
router.post('/lognout',unauthrized,lognout);
router.get('/dashboard',unauthrized,dashboard);
router.post('/update',unauthrized || Admin,updateUser);
router.post('/forget-password',forgetPassword);
router.post('/reset-password/:token',resetPassword);
router.delete('/delete',unauthrized,deleteAccount);


module.exports=router