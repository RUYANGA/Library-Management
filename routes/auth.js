const router=require('express').Router();
const { unauthrized ,Admin}=require('../middleware/authMiddleware')
const { Register, login, verifyOtp, resendOtp, lognout, dashboard, updateUser }=require('../controller/auth')

router.post('/register',Register);
router.post('/login',login)
router.post('/verifyotp',verifyOtp);
router.post('/resendotp',resendOtp);
router.post('/lognout',lognout);
router.get('/dashboard',unauthrized,dashboard)
router.post('/update/:id',unauthrized,updateUser)
module.exports=router