const mongoose = require("mongoose");
require("dotenv").config()
const Customer = require("../Schema/customer")
const URL = "mongodb://localhost:27017/gym";
const bcrypt = require("bcryptjs")

mongoose.connect(URL).then(console.log("Connected to the database."))

let i;
async function findUser() {
    let i;
    let password = bcrypt.hashSync("1234",5)
    for(i=1;i<1282;i++) {
        await Customer.findOneAndUpdate({ID:i},{PASSWORD:password},{new:true})
    }
}

findUser();