const Customer = require("../Schema/customer");
const punch = require("../Schema/punch");
const Payment = require("../Schema/payment");

function formatDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1; 
    let day = date.getDate();
    return `${year}-${month}-${day}`;
}

function getNoonTime(date) {
    let noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    return noon;
}

exports.morningAttendance = async (req, res) => {
    try {
        let { date, page = 1, limit = 100 } = req.query; 
        limit = parseInt(limit);
        page = parseInt(page);

        if (!date) {
            date = new Date(); 
        } else {
            date = new Date(date);
        }

        let nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        const totalCount = await punch.countDocuments({
            IN_TIME: { $gte: formatDate(date), $lt: getNoonTime(date) }
        });

        const userPunches = await punch.find({
            IN_TIME: { $gte: formatDate(date), $lt: getNoonTime(date) }
        })
        .skip((page - 1) * limit)
        .limit(limit);

        if (!userPunches || userPunches.length === 0) {
            return res.status(200).json({ user: "No users present in the morning." });
        }

        let users = [];
        for (const userPunch of userPunches) {
            let customer = await Customer.findOne({ ID: userPunch.CUSTOMER_PROFILE_ID });
            if (customer) {
                let payment = await Payment.findOne({
                    CUSTOMER_PROFILE_ID: userPunch.CUSTOMER_PROFILE_ID,
                    PAYMENT_DATE: { $gte: formatDate(date), $lt: nextDate }
                });

                users.push({
                    ID: customer.ID,
                    NAME: customer.NAME,
                    PHONE: customer.PHONE,
                    IN_TIME: userPunch.IN_TIME,
                    OUT_TIME: userPunch.OUT_TIME,
                    PAYMENT_STATUS: payment ? "Paid" : "Not paid",
                    PAYMENT_TYPE: payment ? payment.PAYMENT_TYPE : null,
                    PAYMENT_AMOUNT: payment ? payment.PAYMENT_AMOUNT : null,
                    EFFECTIVE_DATE: payment ? payment.EFFECTIVE_DATE : null,
                    END_DATE: payment ? payment.END_DATE : null,
                    PAYMENT_DATE: payment ? payment.PAYMENT_DATE : null,
                    PAYMENT_BALANCE: payment ? payment.PAYMENT_BALANCE : null,
                });
            }
        }

        return res.status(200).json({
            user: users,
            totalCount, 
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (err) {
        return res.status(500).json({ user: "Internal Server Error", err: err });
    }
};


exports.eveningAttendance = async (req, res) => {
    try {
        let { date, page = 1, limit = 100 } = req.query; 
        limit = parseInt(limit);
        page = parseInt(page);

        if (!date) {
            date = new Date();
        } else {
            date = new Date(date);
        }

        let noonTime = getNoonTime(date);
        let nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const totalCount = await punch.countDocuments({
            IN_TIME: { $gte: noonTime, $lt: nextDate }
        });

        const userPunches = await punch.find({
            IN_TIME: { $gte: noonTime, $lt: nextDate }
        })
        .skip((page - 1) * limit)
        .limit(limit);

        if (!userPunches || userPunches.length === 0) {
            return res.status(200).json({ user: "No users present in the evening." });
        }

        let users = [];
        for (const userPunch of userPunches) {
            let customer = await Customer.findOne({ ID: userPunch.CUSTOMER_PROFILE_ID });
            if (customer) {
                let payment = await Payment.findOne({
                    CUSTOMER_PROFILE_ID: userPunch.CUSTOMER_PROFILE_ID,
                    PAYMENT_DATE: { $gte: formatDate(date), $lt: nextDate }
                });

                users.push({
                    ID: customer.ID,
                    NAME: customer.NAME,
                    PHONE: customer.PHONE,
                    IN_TIME: userPunch.IN_TIME,
                    OUT_TIME: userPunch.OUT_TIME,
                    PAYMENT_STATUS: payment ? "Paid" : "Not paid",
                    PAYMENT_TYPE: payment ? payment.PAYMENT_TYPE : null,
                    PAYMENT_AMOUNT: payment ? payment.PAYMENT_AMOUNT : null,
                    EFFECTIVE_DATE: payment ? payment.EFFECTIVE_DATE : null,
                    END_DATE: payment ? payment.END_DATE : null,
                    PAYMENT_DATE: payment ? payment.PAYMENT_DATE : null,
                    PAYMENT_BALANCE: payment ? payment.PAYMENT_BALANCE : null,
                });
            }
        }

        return res.status(200).json({
            user: users,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (err) {
        return res.status(500).json({ user: "Internal Server Error", err: err });
    }
};

exports.monthlyAttendance = async (req, res) => {
    try {
        let { date, page = 1, limit = 50 } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required." });
        }
        date = new Date(date);
        let startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        let endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const totalCount = await punch.countDocuments({
            IN_TIME: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const userPunches = await punch.find({
            IN_TIME: { $gte: startOfMonth, $lt: endOfMonth }
        })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ IN_TIME: 1 });

        if (!userPunches || userPunches.length === 0) {
            return res.status(200).json({ user: "No users present in the selected month." });
        }

        let users = [];
        for (const userPunch of userPunches) {
            let customer = await Customer.findOne({ ID: userPunch.CUSTOMER_PROFILE_ID });
            if (customer) {
                let payment = await Payment.findOne({
                    CUSTOMER_PROFILE_ID: userPunch.CUSTOMER_PROFILE_ID,
                    PAYMENT_DATE: { $gte: startOfMonth, $lt: endOfMonth }
                });

                users.push({
                    ID: customer.ID,
                    NAME: customer.NAME,
                    PHONE: customer.PHONE,
                    IN_TIME: userPunch.IN_TIME,
                    OUT_TIME: userPunch.OUT_TIME,
                    PAYMENT_STATUS: payment ? "Paid" : "Not paid",
                    PAYMENT_TYPE: payment ? payment.PAYMENT_TYPE : null,
                    PAYMENT_AMOUNT: payment ? payment.PAYMENT_AMOUNT : null,
                    EFFECTIVE_DATE: payment ? payment.EFFECTIVE_DATE : null,
                    END_DATE: payment ? payment.END_DATE : null,
                    PAYMENT_DATE: payment ? payment.PAYMENT_DATE : null,
                    PAYMENT_BALANCE: payment ? payment.PAYMENT_BALANCE : null,
                });
            }
        }

        return res.status(200).json({
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            users: users
        });
    } catch (err) {
        console.error("Error fetching monthly attendance:", err);
        return res.status(500).json({ user: "Internal Server Error", err: err });
    }
};



exports.attendAt = async(req,res) => {

    try{
        let {date} = req.body;
        if(!date){
            date = new Date();
            date = new Date(await TimeZoneFormat(date));
        }

        let nextDate = new Date(await TimeZoneFormatOfNextDate(new Date(date)));

        date = new Date(date);

        
        const UserPunch = await punch.find({CREATED_DATE: {$gte: date, $lte: nextDate}});
        
        if(!UserPunch) {
            return res.status(200).json({user:"Not user present on that date."})
        }

        let users = new Array();
        for(const user of UserPunch) {
            let tmp = await Customer.findOne({ID:user.CUSTOMER_PROFILE_ID});
            let response = {
                ID: tmp.ID,
                NAME: tmp.NAME,
                PHONE: tmp.PHONE,
                IN_TIME: user.IN_TIME,
                OUT_TIME: user.OUT_TIME,
            }
            users.push(response)
        }
        if(!users) {
            return res.status(200).json({user:"No user present on that date."})
        }
        return res.status(200).json({user:users})

    }
    catch(err) {
        return res.status(500).json({user:"Internal Server Error",err:err})
    }
}

exports.search = async (req, res) => {
    try {
        const { CUSTOMER_PROFILE_ID } = req.params; 

        if (!CUSTOMER_PROFILE_ID) {
            return res.status(400).json({ message: "Customer Profile ID is required." });
        }
        const customer = await Customer.findOne({ ID: CUSTOMER_PROFILE_ID });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }
        const userPunches = await punch.find({ CUSTOMER_PROFILE_ID });

        if (!userPunches || userPunches.length === 0) {
            return res.status(200).json({ message: "No attendance records found for this customer." });
        }

        let attendanceRecords = [];
        for (const userPunch of userPunches) {
            attendanceRecords.push({
                ID: customer.ID,
                NAME: customer.NAME,
                PHONE: customer.PHONE,
                IN_TIME: userPunch.IN_TIME,
                OUT_TIME: userPunch.OUT_TIME,
            });
        }

        return res.status(200).json({
            customer: {
                ID: customer.ID,
                NAME: customer.NAME,
                PHONE: customer.PHONE,
            },
            attendance: attendanceRecords
        });
    } catch (err) {
        console.error("Error searching customer:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err });
    }
};
