const Customer = require("../Schema/customer")
const jwt = require("jsonwebtoken");
const Payment = require("../Schema/payment");
const Punch = require("../Schema/punch")
require("dotenv").config()


async function tokenId(token) {
    let secret = process.env.SECRET || "12345";
    if(!token) {
        return null
    }
    token = token.slice(7)
    try {
        let user = jwt.verify(token,secret);
        if(user) {
            return user;
        }
        return null;
    }
    catch(err) {
        return null;
    }
}

exports.dashboard = async(req,res) => {
    let user = await tokenId(req.headers.authorization)
    if(user === null) {
        return res.status(404).json({status:"Unauthorized Access"})
    }

    const info = await Customer.findOne({ID:user.id, EMAIL:user.email, NAME: user.name},{PASSWORD:0,});
    if(!info) {
        return res.status(404).json({status:"User not found."})
    }
    let payment = await Payment.find({CUSTOMER_PROFILE_ID:user.id});
    if(!payment){
        payment = "No payment done by this user"
    }
    return res.status(200).json({info:info, payment:payment})
}

exports.paymentofUser = async(req,res) => {
    const user = tokenId(req.headers.authorization);
    if(user === null)
        return res.status(404).json({status:"Invalid token"});
    try {
        const pay = await Payment.find({CUSTOMER_PROFILE_ID: user?.id})
        return res.status(200).json({payment:pay})
    }
    catch(err) {
        return res.status(500).json({status:err})
    }
    

}

exports.punch = async(req,res) => {
    const user = await tokenId(req.headers.authorization);
    if(user === null)
        return res.status(404).json({status:"Invalid token"});
    try {
        console.log(user.id)
        let time = await Punch.find({CUSTOMER_PROFILE_ID:user?.id})
        return res.status(200).json({punch:time})
    }
    catch(err) {
        return res.status(500).json({status:err})
    }
}