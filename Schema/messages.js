const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    phone: String,
    message: String,
    sid: String,
    time: Date,
    reason: String
})

const Message = new mongoose.model("messageRecord",Schema)

module.exports = Message;