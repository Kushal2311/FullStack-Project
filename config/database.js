const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL , {
        useNewUrlParser : true ,
        useUnifiedTopology : true ,
    })
    .then( ()=> console.log("DB connected Successfully"))
    .catch((error)=>{
        console.log("DB Connection Failed");
        console.log("Error" , error);
        process.exit(1);
    })
}


// import { DB_NAME } from "../constant.js";


// const connectDB = async() => {
//     try{
//         const connectionInsta = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME }`)
//         console.log(`\n MongoDB Connected !! DB host : ${connectionInsta.connection.host}`);

//     }
//     catch(error){
//         console.log("MONGODB connection error " , error);
//         process.exit(1);
//     }
// }

// export default connectDB ;