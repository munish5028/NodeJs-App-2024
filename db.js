const mongoose = require("mongoose")
const dotenv = require("dotenv")
dotenv.config()

mongoose.connect(process.env.URL).then(()=>{
    console.log("database connected")
}).catch((err)=>{
    console.log("database not connected",err)

})
