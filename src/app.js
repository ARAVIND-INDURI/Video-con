import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials :true,
}));

app.get('/',(req,res)=>{
let path = '/home/aravind/Desktop/Codes/web_devlopment/Backend/Video_con_project/frontend/index.html'
  res.sendFile(path);
})

app.use(express.json({limit :"20kb"}));
app.use(express.urlencoded({extended : true}));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import UserRouter from "./routes/user.routes.js"
import VideoRouter from "./routes/video.routes.js"


//routes declaration.
app.use("/api/v1/users/",UserRouter);
app.use("/api/v1/videos/",VideoRouter);

export default app;