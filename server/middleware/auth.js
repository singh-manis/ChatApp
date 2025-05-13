import  jwt  from "jsonwebtoken";
import User from "../models//User.js"

//middleware to protect route
export const protectRoutes = async (req,res,next)=>{
   try{
    const token = req.headers.token;  //It tries to read the JWT token from the request's headers.

    const decoded = jwt.verify(token,process.env.JWT_SECRET)
   
    //After decoding the token, it extracts the userId from the payload.
    const user = await User.findById(decoded.userId).select("-password");
    //.select("-password") means: don’t return the password field (for security).

    //if the user isn’t found in the database 
    if(!user) return res.json({
      success:false,
      message:"User not found"
    });
    
    //Adds the user object to the req so the next middleware or route handler can access the authenticated user.
    req.user=user;
    next();
   }
   catch(error){
      console.log(error.message);
      res.json({
        success:false,
        message:error.message
      })
   }
}