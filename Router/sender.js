require("dotenv").config();
let authToken = process.env.AUTH;
let accountSid = process.env.SID;
let phone = process.env.PHONE;
const Message = require("../Schema/messages")

const client = require('twilio')(accountSid, authToken);

exports.messager = async (body, to, reason) => {
    try {
        const message = await client.messages.create({
            body: body,
            from: `${phone}`,
            to: `+91${to}`
        });

        const record = new Message({
            phone: to,
            sid: message.sid,
            message: body,
            time: new Date(),
            reason: reason
        });

        await record.save();
    } catch (error) {
        console.error("Error sending message:", error);
    }
}
