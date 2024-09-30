const {Schema, mongoose} = require("mongoose")

const punchSchema = Schema({
    CUSTOMER_PROFILE_ID:Number,
    CUSTOMER_NAME:String,
    PHONE:String,
    IN_TIME:Date,
    OUT_TIME:Date,
    DURATION:Number,
    PHONE:Number,
    SLOT:String,
    CREATED_BY:String,
    CREATED_DATE:Date
});

const punch = new mongoose.model("customer_activity",punchSchema);

module.exports = punch;