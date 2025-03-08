const User=require('../modeles/user');
const Books=require('../modeles/books');
const Notfication=require('../modeles/notifications')
const twilio=require('twilio');
const { addWeeks}=require('date-fns')



const borrowBooks=async(req,res)=>{
   try {
        const {studentName,classLevel,studentPhone,parentPhone,bookTitle,bookCode,datetoReturn}=req.body

        const userId=req.session.user.id;

        if(!userId)return res.status(400).json({message:'Librarian id requied'});

        const user=await User.findOne({_id:userId});

        if(!user)return res.status(404).json({message:'Librarian not found'});

        if(!(studentName && classLevel  && parentPhone &&bookTitle && bookCode ))return res.status(400).json({message:'All fields are required'});
        const currentDate=new Date()
        const expiredDate= addWeeks(currentDate,1)

        const borrowed=await Books.create({
            studentName,
            classLevel,
            studentPhone,
            parentPhone,
            bookTitle,
            userId,
            bookCode,
            datetoReturn:expiredDate
        });
        const client= twilio(process.env.TWILIO_SID,process.env.TWILIO_TOKEN);
      
        console.log(expiredDate)
        console.log(currentDate)

       const notifications= client.messages.create({
            body:`Student borrowing a book: ${borrowed.bookTitle}, student name is: ${borrowed.studentName} ,class studies is : ${borrowed.classLevel}, time taken is :${borrowed.dateTaken} , time to return is :${expiredDate}`,
            from:process.env.TWILIO_PHONE,
            to:'+250780905910'
        });


        await Notfication.create({
            Message:`Student borrowing a book: ${borrowed.bookTitle} student name is: ${borrowed.studentName} class studies is : ${borrowed.classLevel} time taken is :${borrowed.dateTaken}  time to return is :${expiredDate}`,
            Librarian:`+250780905910`
        })


        // if(currentDate === expiredDate)return client.messages.create({
        //     body:'Hell'
        // })


        const updateUser=await User.findByIdAndUpdate({_id:userId},{$push:{booksBorrowed:borrowed}},{new:true});

        await updateUser.save();;

        res.status(200).json({message:'Book borrowed successfuly '})
   } catch (error) {
    console.log('Errot to borrow books',error);
    return res.status(500).json({message:'Error to borrow books'});
    
   }

}

const showNotification=async(req,res)=>{
    try {
        const notifications=await Notfication.find();
        res.status(200).json({Notification:notifications})
    } catch (error) {
        return res.status(500).json({message:'Error to show notifications'})
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

    
};

const deleteBookBorrowed = async (req, res) => {
    const bookId = req.params.id;
    if (!bookId) return res.status(400).json({ message: "Book ID required" });

    try {
        // Delete the book from the Books collection
        const deleteBook = await Books.findByIdAndDelete(bookId);
        if (!deleteBook) return res.status(404).json({ message: "Book not found" });

        // Remove the book from the user's booksBorrowed array
        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            { $pull: { booksBorrowed: { _id: bookId } } },
            { new: true }
        ); // Return the updated user document

        if (!user) return res.status(404).json({ message: "User not found" });

        // Return updated user data
        return res.status(200).json({ message: "Book deleted and user updated successfully"});
    } catch (error) {
        // Log the error for debugging
        console.error("Error:", error);
        return res.status(500).json({ message: "Error deleting book", error: error.message });
    }
};


module.exports={ borrowBooks,updateBooks ,deleteBookBorrowed ,showNotification}