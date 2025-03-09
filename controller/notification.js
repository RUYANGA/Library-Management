const Notification=require('../modeles/notifications');



const showNotification=async(req,res)=>{
    try {
        const notifications=await Notification.find();
        res.status(200).json({Notification:notifications})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:'Error to show notifications'})
    }
}

const deletNotification=async(req,res)=>{
    try {
        const id=req.params.id;
        const notification=await Notification.findById({_id:id})
        if(!notification)return res.status(404).json({message:'Notification not found'})
        const deleteNotification=await Notification.findByIdAndDelete({_id:id})
      
        res.status(200).json({message:'Notification deleted successfully'})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:'Error to delete notification'})
    }
}


module.exports={showNotification,deletNotification}