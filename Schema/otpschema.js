const { Schema, model } = require("mongoose");

const OtpSchema = new Schema({
    phone: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

const OtpModel = model('Otp', OtpSchema);
module.exports = OtpModel;
