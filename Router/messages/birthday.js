const Customer = require("../../Schema/customer")
const mongoose = require("mongoose")
const path = require("path")
require('dotenv').config({path: path.join(__dirname+"/../../")})



exports.birthday = async() => {

    const today = new Date()

    const dob = await Customer.find({
        $expr: {
            $and: [
                { $eq: [{ $month: "$DOB" }, today.getDate()] },
                { $eq: [{ $dayOfMonth: "$DOB" }, today.getMonth() + 1] }
            ]
        }
    },{ID:0,ADDRESS:0,REFERENCE:0,IMAGE_PATH:0,CREATED_DATE:0,CREATED_BY:0,LAST_MODIFIED_DATE:0,LAST_MODIFIED_BY:0,GYM_PROFILE_ID:0,PASSWORD:0});

    return dob;

}
