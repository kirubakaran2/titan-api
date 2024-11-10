const Customer = require("../Schema/customer");
const {messager} = require("./sender")

exports.specialoff = async(req,res) => {
    const {message} = req.body;

    // STATUS:1 Only for active user
    const users = await Customer.find({})
    for(let user of users) {
        messager(message,user.PHONE,"special offer message");
    }
    return res.status(200).json({status:"Special offer sended."})
}