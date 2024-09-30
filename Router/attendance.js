const Customer = require("../Schema/customer");
const punch = require("../Schema/punch");

// Function to convert date to YYYY-MM-DD format
function formatDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // Month is 0-based
    let day = date.getDate();
    return `${year}-${month}-${day}`;
}

// Helper to calculate 12 PM time for a date
function getNoonTime(date) {
    let noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    return noon;
}

exports.morningAttendance = async (req, res) => {
    try {
        let { date, page = 1, limit = 100 } = req.query; // Get page and limit from query parameters
        limit = parseInt(limit);
        page = parseInt(page);

        if (!date) {
            date = new Date(); // Default to today
        } else {
            date = new Date(date);
        }

        let nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Calculate the total count of UserPunch
        const totalCount = await punch.countDocuments({
            IN_TIME: { $gte: formatDate(date), $lt: getNoonTime(date) }
        });

        // Get the paginated results
        const UserPunch = await punch.find({
            IN_TIME: { $gte: formatDate(date), $lt: getNoonTime(date) }
        })
        .skip((page - 1) * limit)
        .limit(limit);

        if (!UserPunch || UserPunch.length === 0) {
            return res.status(200).json({ user: "No users present in the morning." });
        }

        let users = [];
        for (const userPunch of UserPunch) {
            let customer = await Customer.findOne({ ID: userPunch.CUSTOMER_PROFILE_ID });
            if (customer) {
                users.push({
                    ID: customer.ID,
                    NAME: customer.NAME,
                    PHONE: customer.PHONE,
                    IN_TIME: userPunch.IN_TIME,
                    OUT_TIME: userPunch.OUT_TIME
                });
            }
        }

        return res.status(200).json({
            user: users,
            totalCount, // Include total count for pagination
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (err) {
        return res.status(500).json({ user: "Internal Server Error", err: err });
    }
};

exports.eveningAttendance = async (req, res) => {
    try {
        let { date, page = 1, limit = 100 } = req.query; // Get page and limit from query parameters
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

        // Calculate the total count of UserPunch
        const totalCount = await punch.countDocuments({
            IN_TIME: { $gte: noonTime, $lt: nextDate }
        });

        // Get the paginated results
        const UserPunch = await punch.find({
            IN_TIME: { $gte: noonTime, $lt: nextDate }
        })
        .skip((page - 1) * limit)
        .limit(limit);

        if (!UserPunch || UserPunch.length === 0) {
            return res.status(200).json({ user: "No users present in the evening." });
        }

        let users = [];
        for (const userPunch of UserPunch) {
            let customer = await Customer.findOne({ ID: userPunch.CUSTOMER_PROFILE_ID });
            if (customer) {
                users.push({
                    ID: customer.ID,
                    NAME: customer.NAME,
                    PHONE: customer.PHONE,
                    IN_TIME: userPunch.IN_TIME,
                    OUT_TIME: userPunch.OUT_TIME
                });
            }
        }

        return res.status(200).json({
            user: users,
            totalCount, // Include total count for pagination
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (err) {
        return res.status(500).json({ user: "Internal Server Error", err: err });
    }
};


// Monthly Attendance API
exports.monthlyAttendance = async (req, res) => {
    try {
        let { date, page = 1, limit = 50 } = req.query; // Default limit set to 50

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
        .skip((page - 1) * limit) // Pagination skip
        .limit(parseInt(limit)) // Pagination limit
        .sort({ IN_TIME: 1 });

        if (!userPunches || userPunches.length === 0) {
            return res.status(200).json({ user: "No users present in the selected month." });
        }

        let users = [];
        for (const userPunch of userPunches) {
            let customer = await Customer.findOne({ ID: userPunch.CUSTOMER_PROFILE_ID });
            if (customer) {
                users.push({
                    ID: customer.ID,
                    NAME: customer.NAME,
                    PHONE: customer.PHONE,
                    IN_TIME: userPunch.IN_TIME,
                    OUT_TIME: userPunch.OUT_TIME
                });
            }
        }
        return res.status(200).json({
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            user: users
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