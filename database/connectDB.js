const { default: mongoose } = require("mongoose");

const connectDB = async () =>{
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/merchantlocal', {
            useUnifiedTopology : true,
            useNewUrlParser : true,
        });
        console.log('db connected');
        
        
    } catch(error){
        console.log(error);
    }
}
module.exports = connectDB;