const mongoose = require("mongoose");
const punch = require("../Schema/punch");
const Customer = require("../Schema/customer");
const { messager } = require("./sender");
const moment = require("moment-timezone");
const Payment = require("../Schema/payment");

exports.intime = async (req, res) => {
    const { id } = req.body;
    const user = await Customer.findOne({ ID: id });
    if (!user) {
        return res.status(404).json({ status: "User not found." });
    }

    const now = moment().tz("Asia/Kolkata");
    const dateString = now.format("YYYY-MM-DD");
    const date = moment(dateString).startOf("day");

    let Checking = await punch.findOne({
        CUSTOMER_PROFILE_ID: id,
        IN_TIME: { $lte: now.toDate(), $gte: date.toDate() },
        CREATED_DATE: { $lte: now.toDate(), $gte: date.toDate() }
    });
    if (Checking) return res.json({ status: "You already punched in for today." });
    const UserPunch = new punch({
        CUSTOMER_PROFILE_ID: id,
        CUSTOMER_NAME: user.NAME,
        PHONE: user.PHONE,
        IN_TIME: now.toDate(),
        OUT_TIME: null,
        SLOT: "",
        CREATED_BY: "",
        CREATED_DATE: now.toDate()
    });

    try {
        await UserPunch.save();
        const msg = `Hi ${user.NAME},

        Great to see you! You’ve punched in for your workout session at ${now.format("hh:mm A")}. Remember, you have 1 hour to crush your goals. Let’s make it count!

        Keep pushing,
        Titanfitnessstudio`;
        messager(msg, user.PHONE, 'in time entry message.');

        const payments = await Payment.find({ CUSTOMER_PROFILE_ID: id }).sort({ "PAYMENT_DATE": -1 });

        if (payments.length > 0) {
            const lastPayment = payments[0];
            const endDate = moment(lastPayment.END_DATE);

            console.log("End Date:", endDate.format("DD-MM-YYYY"));

            const daysLeft = endDate.diff(now, 'days');  

            if (now.isBefore(endDate) && now.isSameOrAfter(endDate.subtract(3, 'days'))) {
                let reminderMsg;

                if (daysLeft === 1) {
                    reminderMsg = `Hi ${user.NAME}, 

                    Your payment due date is tomorrow! Kindly make sure to pay your fees before enddate to avoid deactivation.

                    Thank you 😊 and keep pushing 💪🏋️‍♀️
                    
                    Titanfitnessstudio`;
                } else if (daysLeft === 2) {
                    reminderMsg = `Hi ${user.NAME}, 

                    You have 2 days left to pay your fees! Kindly make sure to pay before enddate to avoid deactivation.

                    Thank you 😊 and keep pushing 💪🏋️‍♀️
                    
                    Titanfitnessstudio`;
                } else {
                    reminderMsg = `Hi ${user.NAME}, 

                    Your payment due date is approaching! Kindly make sure to pay your fees before ${endDate.format("DD-MM-YYYY")} to avoid deactivation.

                    Thank you 😊 and keep pushing 💪🏋️‍♀️
                    
                    Titanfitnessstudio`;
                }

                console.log("Sending reminder message...");
                messager(reminderMsg, user.PHONE, 'payment reminder');
            } else if (now.isAfter(endDate)) {
                const overdueMsg = `Hi ${user.NAME}, 

                Your payment due date was ${endDate.format("DD-MM-YYYY")}. Kindly make the payment to avoid deactivation of your id.

                Thank you 😊 and keep pushing 💪🏋️‍♀️
                
                Titanfitnessstudio`;
                console.log("Sending overdue message...");
                messager(overdueMsg, user.PHONE, 'payment overdue warning');
            }
        } else {
            console.log("No payment history found for this user.");
        }

        return res.status(200).json({ status: "In time entered." });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ status: "Internal Server Error" });
    }
};

exports.outTime = async (req, res) => {
    const { id } = req.body;
    const now = moment().tz("Asia/Kolkata");

    const user = await Customer.findOne({ ID: id });
    if (!user) {
        return res.status(404).json({ status: "User ID not found." });
    }

    const dateString = now.format("YYYY-MM-DD");
    const date = moment(dateString).startOf("day");

    const checking = await punch.findOne({
        CUSTOMER_PROFILE_ID: id,
        IN_TIME: { $lte: now.toDate(), $gte: date.toDate() },
        CREATED_DATE: { $lte: now.toDate(), $gte: date.toDate() }
    });

    if (!checking) {
        return res.status(404).json({ status: `In time not found for user ${id}.` });
    }

    if (checking.OUT_TIME !== null) {
        return res.status(400).json({ status: `Out time already exists for user ${id}.` });
    }

    try {
        await punch.findOneAndUpdate(
            { CUSTOMER_PROFILE_ID: id, IN_TIME: { $lte: now.toDate(), $gte: date.toDate() } },
            { OUT_TIME: now.toDate() },
            { new: true }
        );

        const msg = `You punched out from the gym at ${now.format("hh:mm A")}.

        Keep pushing,
        Titanfitnessstudio`;

        await messager(msg, user.PHONE, 'out time entry message.');
        return res.status(200).json({ status: "Out time recorded." });
    } catch (err) {
        console.error("Error updating out time or sending message:", err);
        return res.status(500).json({ status: "Internal Server Error", error: err });
    }
};


exports.getIn = async(req,res) => {
    const userId = req.query.userId;
    let today = new Date();
    try {
        if(userId) {
            let timing = await punch.findOne({CUSTOMER_PROFILE_ID:userId,
                $expr: {
                    $and: [
                        { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                        { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                        { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                    ]
                }
            },{OUT_TIME:0});
            if(timing===null)
                timing = [];
            return res.status(200).json({timing:timing});
        }
        let timing = await punch.find({
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                    { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                    { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                ]
            }
        },{OUT_TIME:0})
        return res.status(200).json({timing: timing});
    }
    catch(err) {
        console.log(err)
        return res.status(500).json({status:"Internal Server Error",error:err})
    }
}

exports.getOut = async(req,res) => {
    const userId = req.query.userId;
    let today = new Date();
    try {
        if(userId) {
            let timing = await punch.findOne({CUSTOMER_PROFILE_ID:userId,
                $expr: {
                    $and: [
                        { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                        { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                        { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                    ]
                }
            });
            if(timing===null)
                timing = [];
            return res.status(200).json({timing:timing});
        }
        let timing = await punch.find({
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                    { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                    { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                ]
            }
        })
        return res.status(200).json({timing: timing});
    }
    catch(err) {
        return res.status(500).json({status:"Internal Server Error"})
    }
}

exports.attendance = async (req, res) => {
    let { page, date } = req.query;

    page = page === undefined ? 0 : page * 50;
    const customer = await Customer.find({}, { PASSWORD: 0 }, { skip: page, limit: 50 }).sort({ ID: "asc" });
    let customers = [];

    try {
        let today = new Date();
        if (date) {
            today = new Date(date);
        }

        let thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        for (let user of customer) {
            let timing = await punch.findOne({
                CUSTOMER_PROFILE_ID: user.ID,
                $expr: {
                    $and: [
                        { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                        { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                        { $eq: [{ $year: "$CREATED_DATE" }, today.getUTCFullYear()] }
                    ]
                }
            });

            let pay = await Payment.findOne({
                CUSTOMER_PROFILE_ID: user.ID,
                PAYMENT_DATE: { $gte: thisMonth, $lt: nextMonth }
            });

            let details = {
                ID: user.ID,
                NAME: user.NAME,
                DOB: user.DOB,
                PHONE: user.PHONE,
                EMAIL: user.EMAIL,
                ADDRESS: user.ADDRESS,
                IMAGE_PATH: user.IMAGE_PATH,
                IN_TIME: timing ? timing.IN_TIME : null,
                OUT_TIME: timing ? timing.OUT_TIME : null,
                ATTENDANCE: timing ? 'present' : 'absent',
                PAYMENT_STATUS: pay ? "Paid" : "Not paid",
                PAYMENT_TYPE: pay ? pay.PAYMENT_TYPE : null,
                PAYMENT_AMOUNT: pay ? pay.PAYMENT_AMOUNT : null,
                EFFECTIVE_DATE: pay ? pay.EFFECTIVE_DATE : null,
                END_DATE: pay ? pay.END_DATE : null,
                PAYMENT_DATE: pay ? pay.PAYMENT_DATE : null,
                PAYMENT_BALANCE: pay ? pay.PAYMENT_BALANCE : null,
            };

            customers.push(details);
        }

        return res.status(200).json({ customer: customers });
    } catch (e) {
        return res.status(500).json({ status: "Something went wrong", error: e });
    }
};
