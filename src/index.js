// require('dotenv').config({path: './env'})
import 'dotenv/config.js'
import connectDB from "./db/index.js";
import app from './app.js';


connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("Server Started")
    })
})
.catch((err)=>{
    console.log("Mongo Connection Failed! ",err)
})