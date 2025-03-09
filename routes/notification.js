const {showNotification,deletNotification}=require('../controller/notification');



const router=require('express').Router();

router.get('/show',showNotification);
router.delete('/delete/:id',deletNotification)



module.exports=router