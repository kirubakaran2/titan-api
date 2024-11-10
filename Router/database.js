const mongoose = require('mongoose');
require('dotenv').config()
const AUTH="1fd1a48f063b1bd95734e5d5f135f9f4"
const DBURL="mongodb+srv://shell:1234@gym.mmwixka.mongodb.net/gym_new"
const SECRET="12c4DD1VH0"
const url = DBURL;
const options = {
}
 
exports.db = () => {  
    mongoose.connect(url,options).
    then(console.log("Connected to the datase")).
    catch((err) => console.log("Didn't connect to the database",err))
}