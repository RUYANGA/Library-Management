const { borrowBooks, updateBooks, deleteBookBorrowed, showNotification }=require('../controller/books');
const { unauthrized, Admin } = require('../middleware/authMiddleware');

const router=require('express').Router();

router.post('/borrow',unauthrized, borrowBooks);
router.post('/update/:bookId',unauthrized,Admin,updateBooks);
router.delete('/delete/:id',unauthrized,deleteBookBorrowed);
router.get('/notification',showNotification)


module.exports=router