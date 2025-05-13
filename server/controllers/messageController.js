import Message from "../models/Message.js";
import User from "../models/User.js"; 
import cloudinary from "../lib/cloudinary.js";
import{io,userSocketMap} from "../server.js";

//get all user except the logged in user
export const getUsersForSidebar=async(req,res)=>{
  try{
     const userId  =req.user._id;
     //Finds all users where _id is not equal ($ne) to the current user's ID, and excludes the password field from the result.
     const filteredUsers=await User.find({_id: {$ne:userId}}).select("-password");

     //const number of message not seen
      const unseenMessages ={}
      const promises  =filteredUsers.map(async(user)=>{
        const message=await Message.find({senderId:user._id,receiverId:userId,seen:false})
        //To find how many unseen messages this user has sent to the logged-in user.
        if(message.length>0){
          unseenMessages[user._id] = message.length;
        }
      })
      await Promise.all(promises);
      //Waits for all the database queries inside the map() function to finish.
      res.json({
        success:true,
        users:filteredUsers,
        unseenMessages,
      });
  }
  catch(error){
    console.log(error.message);
    res.json({
      success:false,
      message:error.message,
    })

  }
}

//get all messages for selected user
export const getMessages = async(req,res)=>{
  try{
    const {id:selectedUserId} =req.params;
    const myId =req.user._id;

    const messages= await Message.find({
      $or:[
        {senderId:myId ,receiverId:selectedUserId},
        {senderId:selectedUserId,receiverId:myId},
      ]
    })
    await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});

    res.json({
      success:true,
      messages,
    });
  }
  catch(error){
    console.log(error.message);
    res.json({
      success:false,
      message:error.message
    })
  }
}

//api to mark messaeg to seen using message id
export const markMessageAsSeen=async(req,res)=>{
  try{
    const {id}  =req.params;
    await Message.findByIdAndUpdate(id, {seen:true})

    res.json({
      success:true,
    })

  }
  catch(error){
    console.log(error.message);
    res.json({
      success:false,
      message:error.message
    })
  }
}

//Send message to selected user
export const sendMessage =async(req,res)=>{
  try{

    const {text,image}=req.body;
    const receiverId =req.params.id;
    const senderId=req.user._id;

    let imageUrl;
    if(image){
      const uploadResponse  =await cloudinary.uploader.upload(image)
      imageUrl=uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image:imageUrl
    })

    //emit the new message to the receivers socket
    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage" ,newMessage)
    }
    
    res.json({
      success:true,
      newMessage,
    });

  }
  catch(error){
    console.log(error.message);
    res.json({
      success:false,
      message:error.message
    })
  }
}