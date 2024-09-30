const {Schema, model} = require("mongoose")

const UserSchema = Schema({
    ID: Number,
    NAME:String,
    DOB:Date,
    PHONE: String,
    EMAIL:String,
    ADDRESS:String,
    IMAGE_PATH:String,
    ROLE:String,
    PASSWORD:String
})

const Customer = new model('admins',UserSchema);

module.exports =  Customer;