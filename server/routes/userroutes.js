import express from "express";
import { checkAuth, login, signup, updateProfile } from "../controllers/useController.js";
import { protectRoutes } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup",signup);
userRouter.post("/login",login);
userRouter.put("/update-profile",protectRoutes,updateProfile);
//we protect route using middle ware protectRoutes
userRouter.get("/check",protectRoutes,checkAuth);

export default userRouter;