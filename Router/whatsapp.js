require("dotenv").config();
let authToken = process.env.AUTH;
let accountSid = process.env.SID;
let phone = process.env.PHONE;
let DB = process.env.DBURL;

const client = require('twilio')(accountSid, authToken);

client.messages.create({
    body: "hello world",
    from: `whatsapp:+14155238886`,
    to: `whatsapp:+917708923866`
}).then(message => console.log(message));
