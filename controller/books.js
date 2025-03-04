const User=require('../modeles/user');
const Books=require('../modeles/books');
const twilio=require('twilio');



const borrowBooks=async(req,res)=>{
   try {
        const {studentName,classLevel,studentPhone,parentPhone,bookTitle,bookCode,datetoReturn}=req.body

        const userId=req.session.user.id;

        if(!userId)return res.status(400).json({message:'Librarian id requied'});

        const user=await User.findOne({_id:userId});

        if(!user)return res.status(404).json({message:'Librarian not found'});

        if(!(studentName && classLevel  && parentPhone &&bookTitle && bookCode ))return res.status(400).json({message:'All fields are required'});

        const borrowed=await Books.create({
            studentName,
            classLevel,
            studentPhone,
            parentPhone,
            bookTitle,
            userId,
            bookCode,
            datetoReturn
        });
        const client= twilio(process.env.TWILIO_SID,process.env.TWILIO_TOKEN);

        client.messages.create({
            body:`Student borrowing a book: ${borrowed.bookTitle} student name is: ${borrowed.studentName} class studies is : ${borrowed.classLevel} time taken is :${borrowed.dateTaken}`,
            from:process.env.TWILIO_PHONE,
            to:'+250780905910'
        });


        const updateUser=await User.findByIdAndUpdate({_id:userId},{$push:{booksBorrowed:borrowed}},{new:true});

        await updateUser.save();;

        res.status(200).json({message:'Book borrowed successfuly '})
   } catch (error) {
    console.log('Errot to borrow books',error);
    return res.status(500).json({message:'Error to borrow books'});
    
   }

}

const updateBooks=async(req,res)=>{
   try {
        const {studentName,classLevel,studentPhone,parentPhone,bookTitle,bookCode,datetoReturn}=req.body;

        const { bookId }=req.params;
        //const {userId}=req.params
        if(!bookId)return res.status(400).json({message:'Book id required'});
       
        const book =await Books.findByIdAndUpdate({_id:bookId},{$set:{studentName,classLevel,studentPhone,parentPhone,bookTitle,bookCode,datetoReturn}},{new:true})
        await book.save()

        const user=await User.findByIdAndUpdate({_id:req.session.user.id},{$set:{booksBorrowed:book}},{new:true});

        await user.save()


        res.status(200).json({message:'Book updated'})
    
   } catch (error) {
    console.log('Error to update books',error);
    res.status(500).json({message:'Errot to update book'})
   }

    
}

module.exports={ borrowBooks,updateBooks }