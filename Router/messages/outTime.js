const Punch = require("../../Schema/punch")

exports.outTime = async() => {

    let a = new Date();
    let dateString = `${a.getUTCFullYear()}-${(a.getUTCMonth() + 1).toString().padStart(2, "0")}-${a.getUTCDate().toString().padStart(2, "0")}`;
    let date = new Date(dateString);

    let Checking = await Punch.find({OUT_TIME:null, IN_TIME: {$lte: a, $gte: date}, CREATED_DATE: {$lte: a, $gte: date}})

    return Checking;
}