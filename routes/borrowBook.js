const { borrowBooks, updateBooks, deleteBookBorrowed}=require('../controller/borrowBook');
const {showNotification}=require('../controller/notification')

const { unauthrized, Admin } = require('../middleware/authMiddleware');

const router=require('express').Router();

router.post('/borrow',unauthrized, borrowBooks);
router.post('/update/:bookId',unauthrized,Admin,updateBooks);
router.delete('/delete/:id',unauthrized,Admin,deleteBookBorrowed);
router.get('/notification',showNotification)


module.exports=router