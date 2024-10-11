const Payment = require("../Schema/payment");
const Customer = require("../Schema/customer")

function TimeZoneFormat(now) {
    let year = now.getFullYear()
    let month = now.getMonth() + 1
    let date = now.getDate() + 1
    now = `${year}-${month}-${date}`
    return now
}

function TimeZoneFormatOfNextDate(now) {
    let year = now.getFullYear()
    let month = now.getMonth() + 1
    let date = now.getDate() + 2
    now = `${year}-${month}-${date}`
    return now
}

function TimeMonth(now) {
    let year = now.getFullYear();
    let month = now.getMonth()+1;
    let date = "01";
    now = new Date(`${year}-${month}-${date}`);
    return now;
}

function TimeNextMonth(now) {
    let year = now.getFullYear();
    let month = now.getMonth()+2;
    let date = "01";
    now = new Date(`${year}-${month}-${date}`)
    return now;
}

exports.paymentAt = async(req,res) => {
    let {date} = req.body;
    try {
        if(!date) {
            let date = new Date();
            date = new Date(await TimeZoneFormat(date));
        }
        let nextDate = new Date(await TimeZoneFormatOfNextDate(new Date(date)));
        date = new Date(date);

        const UserPayment = await Payment.find({PAYMENT_DATE: {$gte: date, $lte: nextDate}});

        if(!UserPayment) {
            return res.status(200).json({user:`No user payment on that ${date}`})
        }

        let users = new Array();
        for(let user of UserPayment) {
            let tmp = await Customer.findOne({ID:user.CUSTOMER_PROFILE_ID});
            if(tmp) {
                let response = {
                    ID: tmp.ID,
                    NAME: tmp.NAME,
                    IMAGE: tmp.IMAGE_PATH,
                    PHONE: tmp.PHONE,
                    FEE: user.PAYMENT_AMOUNT,
                    PAYMENT_DATE: user.PAYMENT_DATE
                }

                users.push(response)
            }
        }
        if(!users) {
            return res.status(200).json({user:"No one payment on that date."})
        } 
        return res.status(200).json({user:users})
    }
    catch(err) {
        return res.status(500).json({status:"Internal Server Error."})
    }
}

exports.payment = async (req, res) => {
    let { id, type, amount, effective, end, balance } = req.body;

    // Check for required fields but allow balance to be 0
    if (!id || !type || !amount || !effective || !end || (balance === undefined || balance === null)) {
        return res.status(404).json({
            status: "All the fields are required like customer id, amount, payment type, effective date, end date, and balance."
        });
    }

    try {
        let now = new Date();

        if (typeof (effective) === 'string') {
            effective = new Date(effective);
        }

        if (typeof (end) === "string") {
            end = new Date(end);
        }

        const pay = new Payment({
            CUSTOMER_PROFILE_ID: id,
            PAYMENT_TYPE: type,
            PAYMENT_AMOUNT: amount,
            EFFECTIVE_DATE: effective,
            END_DATE: end,
            PAYMENT_BALANCE: balance,
            PAYMENT_DATE: now
        });

        await pay.save();
        return res.status(200).json({ status: `Payment added for this user ${id}` });
    } catch (err) {
        return res.status(500).json({ status: "Internal Server Error", error: err });
    }
};



exports.paymentEdit = async(req,res) => {
    let {id,amount,end,balance} = req.body;
    if(!id || !amount || !end || balance===undefined) {
        return res.status(404).json({status:"All the fields are required like customer id, amount, payment type, effective date, end date and balance."})
    }

    try {
        let now = new Date();

        if(typeof(end) === "string") {
            end = new Date(end)
        }

        let thisMonth = TimeMonth(now);
        let PrevMonth = TimeNextMonth(now);

        let tmp = await Payment.find({CUSTOMER_PROFILE_ID:id, PAYMENT_DATE: { $gte: thisMonth, $lte: PrevMonth}});
        if(tmp.length==0) {
            return res.status(404).json({status:"No payment details"})
        }
        if(tmp.length > 1) {
            return res.status(301).json({status:`So many payment added for this ${id}. So can't edit for this user.`})
        }

        await Payment.findOneAndUpdate({CUSTOMER_PROFILE_ID:id, PAYMENT_DATE: { $gte: thisMonth, $lte: PrevMonth}}, { PAYMENT_AMOUNT: amount, END_DATE:end, PAYMENT_BALANCE:balance},{new:true})
        .then((data) => {
            return res.status(200).json({status:`Payment edited for this user ${id}`, payment: data})
        }).catch((err) => {
            return res.status(500).json({status:"Internal Server Error", error:err})
        })
    }
    catch(err) {
        return res.status(500).json({status:"Internal Server Error", error: err})
    }
}
// exports.paymentOf = async(req,res) => {
//     const {userID} = req.params;
//     console.log(userID);
//     let today = new Date();
//     const payment = await Payment.find({CUSTOMER_PROFILE_ID:userID,
//         $expr: {
//             $and: [
//                 { $eq: [{ $month: "$PAYMENT_DATE" }, today.getMonth() + 1] },
//                 { $eq: [{ $year: "$PAYMENT_DATE" }, today.getFullYear()] }
//             ]
//         }
//     })

//     if(!payment)
//         return res.status(404).json({status:"No payment on this month for the user."})
//     return res.status(200).json({payment:payment});
// }
exports.paymentOf = async (req, res) => {
    const { userID } = req.params;
    console.log(userID);
    
    try {
        // Find the user
        const user = await Customer.findOne({ ID: userID });
        if (!user) {
            return res.status(404).json({ status: "User not found." });
        }

        // Retrieve all payments for the user
        const payments = await Payment.find({ CUSTOMER_PROFILE_ID: userID }).sort({ PAYMENT_DATE: "asc" });

        if (!payments || payments.length === 0) {
            return res.status(404).json({ status: "No payments found for the user." });
        }

        // Format the payment history
        const paymentHistory = payments.map(pay => ({
            PAYMENT_TYPE: pay.PAYMENT_TYPE,
            PAYMENT_AMOUNT: pay.PAYMENT_AMOUNT,
            EFFECTIVE_DATE: pay.EFFECTIVE_DATE,
            END_DATE: pay.END_DATE,
            PAYMENT_DATE: pay.PAYMENT_DATE,
            PAYMENT_BALANCE: pay.PAYMENT_BALANCE,
        }));

        const response = {
            USER: {
                ID: user.ID,
                NAME: user.NAME,
                DOB: user.DOB,
                PHONE: user.PHONE,
                EMAIL: user.EMAIL,
                ADDRESS: user.ADDRESS,
                IMAGE_PATH: user.IMAGE_PATH,
                PAYMENT_STATUS: payments.length > 0 ? "Paid" : "Not paid", // Change status based on payment history
                PAYMENT_HISTORY: paymentHistory
            }
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "An error occurred.", error: error.message });
    }
};

exports.delPay = async(req,res) => {
    let {_id} = req.params;
    await Payment.findOneAndDelete({_id:_id}).then(() => {
        return res.status(200).json({status:"Deleted"})
    }).catch(() => {return res.status(500).json({status:"Internal Server Error"})})
}
exports.paymentOfAll = async(req,res) => {
    let {page,date} = req.query;
    page = page === undefined ? 0 : page*50;
    const customer = await Customer.find({},{PASSWORD:0},{skip:page,limit:50}).sort({ID:"asc"});
    let customers = new Array();
    try {
        let now = new Date();
        if(date) now = new Date(date);
        let thisMonth = TimeMonth(now);
        let PrevMonth = TimeNextMonth(now);
        for(let user of customer) {
            let pay = await Payment.findOne({CUSTOMER_PROFILE_ID:user.ID, PAYMENT_DATE: { $gte: thisMonth, $lte: PrevMonth}});
            if(pay) {
                let details = {
                    ID: user.ID,
                    NAME: user.NAME,
                    DOB: user.DOB,
                    PHONE: user.PHONE,
                    EMAIL: user.EMAIL,
                    ADDRESS: user.ADDRESS,
                    IMAGE_PATH: user.IMAGE_PATH,
                    PAYMENT_STATUS:"Paid",
                    PAYMENT_TYPE: pay?.PAYMENT_TYPE,
                    PAYMENT_AMOUNT: pay?.PAYMENT_AMOUNT,
                    EFFECTIVE_DATE: pay?.EFFECTIVE_DATE,
                    END_DATE: pay?.END_DATE,
                    PAYMENT_DATE: pay?.PAYMENT_DATE,
                    PAYMENT_BALANCE: pay?.PAYMENT_BALANCE
                }
                customers.push(details);
            }
            else {
                let details = {
                    ID: user.ID,
                    NAME: user.NAME,
                    DOB: user.DOB,
                    PHONE: user.PHONE,
                    EMAIL: user.EMAIL,
                    ADDRESS: user.ADDRESS,
                    IMAGE_PATH: user.IMAGE_PATH,
                    PAYMENT_STATUS:"Not paid"
                }
                customers.push(details);
            }
        }
        return res.status(200).json({customer:customers});
    }
    catch(e) {
        return res.status(500).json({status:"Something went wrong"});
    }
}

exports.paymentcount = async (req, res) => {
    let { date } = req.query;

    try {
        let now = new Date();
        if (date) now = new Date(date);
        let thisMonth = TimeMonth(now);
        let PrevMonth = TimeNextMonth(now);

        // Aggregation pipeline to count paid customers and get their names
        const paidUsers = await Payment.aggregate([
            {
                $match: {
                    PAYMENT_DATE: { $gte: thisMonth, $lte: PrevMonth }
                }
            },
            {
                $group: {
                    _id: "$CUSTOMER_PROFILE_ID",
                    paymentCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "customers", // Ensure this matches the actual name of your Customer collection
                    localField: "_id",
                    foreignField: "ID",
                    as: "customerDetails"
                }
            },
            {
                $unwind: "$customerDetails"
            },
            {
                $group: {
                    _id: "$customerDetails.ID", // Group by customer ID to ensure uniqueness
                    NAME: { $first: "$customerDetails.NAME" },
                    paymentCount: { $first: "$paymentCount" } // Keep the payment count
                }
            },
            {
                $project: {
                    _id: 0,
                    CUSTOMER_PROFILE_ID: "$_id",
                    NAME: 1,
                    paymentCount: 1
                }
            }
        ]);

        const paidCount = paidUsers.length;

        // Count all customers
        const totalUsers = await Customer.countDocuments({});
        const unpaidCount = totalUsers - paidCount;

        return res.status(200).json({
            totalUsers,
            paidCount,
            unpaidCount,
            paidUsers
        });
    } catch (e) {
        return res.status(500).json({ status: "Something went wrong", error: e.message });
    }
}

exports.paymentOfPaid = async (req, res) => {
    let { page = 0, date } = req.query;
    page = parseInt(page) * 50; // Convert page to an integer and multiply by 50 for offset

    try {
        let now = new Date();
        if (date) now = new Date(date);
        let thisMonth = TimeMonth(now);
        let PrevMonth = TimeNextMonth(now);

        // Fetch the specified page of customers, excluding unnecessary fields
        const customers = await Customer.find({}, { PASSWORD: 0, EMAIL: 0, ADDRESS: 0 })
            .sort({ ID: "asc" })
            .skip(page)
            .limit(500);

        // Fetch payments in a single query
        const payments = await Payment.find({
            PAYMENT_DATE: { $gte: thisMonth, $lte: PrevMonth }
        });

        const paymentMap = new Map();
        payments.forEach(pay => {
            paymentMap.set(pay.CUSTOMER_PROFILE_ID, pay);
        });

        let paidCustomers = [];
        let paidCount = 0;

        // Match payments with customers
        for (let user of customers) {
            const pay = paymentMap.get(user.ID);

            if (pay) {
                paidCustomers.push({
                    ID: user.ID,
                    NAME: user.NAME,
                    DOB: user.DOB,
                    PHONE: user.PHONE,
                    IMAGE_PATH: user.IMAGE_PATH,
                    PAYMENT_STATUS: "Paid",
                    PAYMENT_TYPE: pay.PAYMENT_TYPE,
                    PAYMENT_AMOUNT: pay.PAYMENT_AMOUNT,
                    PAYMENT_DATE: pay.PAYMENT_DATE,
                    PAYMENT_BALANCE: pay.PAYMENT_BALANCE
                });
                paidCount++;
            }
        }

        // Get the total number of paid users for further pagination if needed
        const totalPaidUsers = payments.length; // This is an approximation

        return res.status(200).json({ customer: paidCustomers, totalPaidCount: totalPaidUsers });
    } catch (e) {
        return res.status(500).json({ status: "Something went wrong" });
    }
};


exports.paymentOfUnpaid = async (req, res) => {
    let { page, date } = req.query;
    page = page === undefined ? 0 : page * 50;

    const customer = await Customer.find({}, { PASSWORD: 0 }, { skip: page, limit: 50 }).sort({ ID: "asc" });
    let customers = [];

    try {
        let now = new Date();
        if (date) now = new Date(date);
        let thisMonth = TimeMonth(now);
        let PrevMonth = TimeNextMonth(now);

        for (let user of customer) {
            let pay = await Payment.findOne({ CUSTOMER_PROFILE_ID: user.ID, PAYMENT_DATE: { $gte: thisMonth, $lte: PrevMonth } });

            if (!pay) {
                let details = {
                    ID: user.ID,
                    NAME: user.NAME,
                    DOB: user.DOB,
                    PHONE: user.PHONE,
                    EMAIL: user.EMAIL,
                    ADDRESS: user.ADDRESS,
                    IMAGE_PATH: user.IMAGE_PATH,
                    PAYMENT_STATUS: "Not paid"
                };
                customers.push(details);
            }
        }
        return res.status(200).json({ customer: customers });
    } catch (e) {
        return res.status(500).json({ status: "Something went wrong" });
    }
};
