const {Schema, model} = require("mongoose")

const UserSchema = Schema({
    ID: Number,
    NAME:String,
    DOB:Date,
    PHONE: String,
    EMAIL:String,
    ADDRESS:String,
    REFERENCE:String,
    IMAGE_PATH:String,
    CREATED_DATE:Date,
    CREATED_BY:String,
    LAST_MODIFIED_DATE:String,
    LAST_MODIFIED_BY:String,
    GYM_PROFILE_ID:Number,
    PASSWORD:String,
    STATUS:Number
})

const Customer = new model('customers',UserSchema);

module.exports =  Customer;