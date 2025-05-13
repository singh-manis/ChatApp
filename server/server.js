import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userroutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//create express app and http server
const app=express();
const server =http.createServer(app);

//initalize socket.io server
//This allows real-time communication between client and server using WebSockets.
export const io=new Server(server,{
  cors:{origin:"*"}
})

//store online users --- Helps track which users are currently online and their socket connection ID, useful for sending private messages 
export const userSocketMap  ={} //{userId:socketId}

//Socket.io connection handler--This is the entry point to interact with each user's WebSocket session.
io.on("connection" ,(socket)=>{
  const userId  =socket.handshake.query.userid;
  console.log("User connected" ,userId);
  //To identify and track which user has connected.

  //f a valid userId exists, map the user to their socket ID in userSocketMap.--
   //To remember which socket belongs to which user so you can emit data to specific users later.
  if(userId) userSocketMap[userId]=socket.id;

  //Notify All Clients About Online Users
  io.emit("getOnlineUsers"  ,Object.keys(userSocketMap));

  //Handle User Disconnect
  socket.on("disconnect" ,()=>{
    console.log("User Disconnected" ,userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers" , Object.keys(userSocketMap))
  })
  //Remove User from Online Map on Disconnect-----After a user disconnects, sends the updated list of online users to all clients.
})

//middlware setup
app.use(express.json({limit:"4mb"}));
app.use(cors());

app.use("/api/status" ,(req,res) => res.send("Server is live"));
app.use("/api/auth" ,userRouter);
app.use("/api/message" ,messageRouter);

//connect to the mongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT ,() => console.log("Server is running on PORT:" + PORT));