import connectDB from "./DB/db.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({path:'./env'});

connectDB()
.then(() => {
    app.listen(process.env.PORT,()=>{
          console.log(`Server is Running at port:${process.env.PORT}`);
          app.on("error",(error)=>{
            console.log("Error:",error);
            throw error;
          })
    })
})
.catch((error) => {
    console.log("MongoDB Connection Error !!!",error);
})