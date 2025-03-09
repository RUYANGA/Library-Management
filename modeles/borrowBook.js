const mongoose=require('mongoose');

const bookSchema= new mongoose.Schema({
    userId:{
       type:mongoose.Schema.Types.ObjectId,
       ref:'User'
    },
    studentName:{
        type:String,
        required:true
    },
    classLevel:{
        type:String,
        required:true
    },
    studentPhone:{
        type:String
    },
    parentPhone:{
        type:String,
        required:true
    },
    bookTitle:{
        type:String,
        requird:true
    },
    bookCode:{
        type:String,
        required:true
    },
    dateTaken:{
        type:Date,
        default:new Date(Date.now())
    },
    datetoReturn:{
        type:Date,
        required:true
        
    }
})

module.exports=mongoose.model('borrowBook',bookSchema)