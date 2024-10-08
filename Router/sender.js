require("dotenv").config();
let authToken = process.env.FAST2SMS;
const Message = require("../Schema/messages")

exports.messager = async (body, to, reason) => {
    try {

        let requestData = {
            "route":"q",
            "message":body,
            "flash":0,
            "numbers":to

        }

        const response = await fetch("https://www.fast2sms.com/dev/bulkV2",{
            method:"POST",
            headers: {
                "authorization":authToken,
                "Content-Type":"application/json"
            },
            body: JSON.stringify(requestData)
        })


        const record = new Message({
            phone: to,
            message: body,
            time: new Date(),
            reason: reason
        });

        await record.save();
    } catch (error) {
        console.error("Error sending message:", error);
    }
}
