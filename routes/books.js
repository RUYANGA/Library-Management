const { borrowBooks, updateBooks }=require('../controller/books');
const { unauthrized, Admin } = require('../middleware/authMiddleware');

const router=require('express').Router();

router.post('/borrow',unauthrized, borrowBooks);
router.post('/update/:bookId',unauthrized,Admin,updateBooks)


module.exports=router