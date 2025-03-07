const { borrowBooks, updateBooks, deleteBookBorrowed }=require('../controller/books');
const { unauthrized, Admin } = require('../middleware/authMiddleware');

const router=require('express').Router();

router.post('/borrow',unauthrized, borrowBooks);
router.post('/update/:bookId',unauthrized,Admin,updateBooks);
router.delete('/delete/:id',unauthrized,deleteBookBorrowed)


module.exports=router