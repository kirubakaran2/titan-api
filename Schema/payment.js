const {Schema, mongoose} = require("mongoose")

const paymentSchema = Schema({
    CUSTOMER_PROFILE_ID:Number,
    PAYMENT_TYPE: String,
    PAYMENT_AMOUNT: Number,
    EFFECTIVE_DATE:Date,
    END_DATE:Date,
    PAYMENT_DATE:Date,
    PAYMENT_BALANCE:Number,
})

const Payment = new mongoose.model("customer_payments",paymentSchema);

module.exports =  Payment;