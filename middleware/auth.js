const jwt = require("jsonwebtoken")
require("dotenv").config()

exports.authAdmin = async(req,res,next) => {
    let secret = process.env.SECRET || "12345"
    let token = req.headers.authorization;
    if(!token) {
        return res.status(404).json({auth:"Invalid token"})
    }
    token = token.slice(7);
    try {
        let user = jwt.verify(token,secret);
        if(user.role === "admin") {
            next();
        }
        else {
            return res.status(401).json({auth:"Unauthorized access"})
        }
    }
    catch(err) {
        return res.status(404).json({auth:"Invalid token"})
    }
}

exports.authCustomer = async(req,res,next) => {
    let secret = process.env.SECRET || "12345"
    let token = req.headers.authorization;
    if(!token) {
        return res.status(404).json({auth:"Invalid token"})
    }
    token = token.slice(7);
    try {
        let user = jwt.verify(token,secret);
        if(user.role === "customer") {
            next();
        }
        else {
            return res.status(401).json({auth:"Unauthorized access"})
        }
    }
    catch(err) {
        return res.status(404).json({auth:"Invalid token"})
    }
}