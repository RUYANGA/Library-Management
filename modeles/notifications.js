const mongoose=require('mongoose')


const notificationSchem= new mongoose.Schema({
    Message:{
        type:String,
        required:true
    },
    Librarian:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model('Notfication',notificationSchem)