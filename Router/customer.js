const Customer = require("../Schema/customer");
const Payment = require("../Schema/payment")
const Punch = require("../Schema/punch")
const CustomerMeasurement = require("../Schema/measurement");
const {messager} = require("./sender")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');


// exports.createUser = async (req,res) => {
//     let {password, name, mobile, email, dob, address, refer, diet} = req.body;
    
//     const existUser = await Customer.findOne({EMAIL:email});
//     if(existUser) {
//         return res.status(409).json({status:"Already user exist"})
//     }

//     let nowDate = new Date()
//     let oldUser = await Customer.find({}).sort({_id:-1}).limit(1);
//     let ID = oldUser[0]?.ID;
    
//     password = password===undefined ? '1234' : password

//     let encPwd = bcrypt.hashSync(password,5);
//     const imagePath = req.file ? `image/${req.file.filename}` : null;
//     try {
//         const user = await Customer({
//             ID: ID+1,
//             IMAGE_PATH: imagePath,
//             NAME: name,
//             PHONE: mobile,
//             EMAIL: email,
//             DOB: dob,
//             ADDRESS: address,
//             REFERENCE: refer,
//             CREATED_DATE: nowDate,
//             CREATED_BY:"",
//             PASSWORD:encPwd,
//             LAST_MODIFIED_DATE:null,
//             LAST_MODIFIED_BY:null,
//             GYM_PROFILE_ID:1,
//             STATUS:1
//         });

//         user.save().
//         then((data) => {
//             if(diet){
//                 let msg = `Hello ${user.NAME},
                
//                 Welcome aboard! Your account registration was successful. To kickstart your fitness journey, here’s your personalized diet plan: ${diet}. Let's achieve your goals together!
                
//                 Cheers,
//                 Titanfitnessstudio`
//                 messager(msg,mobile,"diet plan");
//             }
//             return res.json({status:"created",userID:ID+1}).status(200)
//         }).
//         catch((err) => {
//             return res.status(301).json({status:"not created", err: err});
//         })
//     }
//     catch(err){
//         return res.json({status:"error", err: err})
//     }
// }
exports.createUser = async (req, res) => {
    let { password, name, mobile, email, dob, address, refer, diet } = req.body;

    const existUser = await Customer.findOne({ EMAIL: email });
    if (existUser) {
        return res.status(409).json({ status: "User already exists." });
    }

    const nowDate = new Date();
    const oldUser = await Customer.find({}).sort({ _id: -1 }).limit(1);
    const ID = oldUser[0]?.ID || 0; // Default to 0 if no users exist

    password = password === undefined ? '1234' : password;
    const encPwd = bcrypt.hashSync(password, 5);
    const imagePath = req.file ? `image/${req.file.filename}` : null;

    try {
        const user = new Customer({
            ID: ID + 1,
            IMAGE_PATH: imagePath,
            NAME: name,
            PHONE: mobile,
            EMAIL: email,
            DOB: dob,
            ADDRESS: address,
            REFERENCE: refer,
            CREATED_DATE: nowDate,
            CREATED_BY: "",
            PASSWORD: encPwd,
            LAST_MODIFIED_DATE: null,
            LAST_MODIFIED_BY: null,
            GYM_PROFILE_ID: 1,
            STATUS: 1
        });

        await user.save();

        // Send diet plan message if provided
        if (diet) {
            let dietMsg = `Hello ${user.NAME},
                
            Welcome aboard! Your account registration was successful. To kickstart your fitness journey, here’s your personalized diet plan: ${diet}. Let's achieve your goals together!
            
            Cheers,
            Titanfitnessstudio`;
            await messager(dietMsg, mobile, "diet plan");
        }
        let rulesMsg = `Hello ${user.NAME},

        Welcome to The Titans Fitness Studio! Please review our policies:
        1. No Refundable.
        2. Twice sessions of workout will double the fees applicable.
        3. Maximum timing of workout be “1 hour” allowed.
        4. Use separate shoes for indoor purposes of workout.
        5. Compulsory use of sweat towel during workout.
        6. Settle the weight and dumbbells in rack after use.
        7. Don’t train other gym mates without master knowledge.
        8. Pay the fees on time.
        9. Handle the equipment and machines gently.
        10. Management will not be responsible for your belongings.
        By Admin,
        Titans Fitness

        THANK YOU`;

        await messager(rulesMsg, mobile, "welcome message");

        return res.status(200).json({ status: "User created", userID: ID + 1 });
    } catch (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({ status: "Error", err: err });
    }
};


exports.edit = async(req,res) => {
    const id = req.params.userId;
    const {image,password, name, mobile, email, dob, address, refer, diet} = req.body;

    const existUser = await Customer.findOne({ID:id});
    if(!existUser) {
        return res.status(409).json({status:"User does not exist"})
    }

    const imagePath = req.file ? `image/${req.file.filename}` : null;

    let nowDate = new Date()
    if(password)    
        var encPwd = bcrypt.hashSync(password,5);

    try {

        Customer.findOneAndUpdate({ID:id},{
            IMAGE_PATH: imagePath!==null ? imagePath : existUser.IMAGE_PATH,
            NAME: name ? name : existUser.NAME,
            PHONE: mobile ? mobile : existUser.PHONE,
            EMAIL: email ? email : existUser.EMAIL,
            DOB: dob ? dob : existUser.DOB,
            ADDRESS: address ? address : existUser.ADDRESS,
            PASSWORD:encPwd ? password : existUser.PASSWORD,
            LAST_MODIFIED_DATE:nowDate,
            LAST_MODIFIED_BY:'admin',
            REFERENCE: refer ? refer : existUser.REFERENCE,
            GYM_PROFILE_ID:1,
            STATUS:1
        },{new:true}).
        then((data) => {
            return res.json({status:"updated"}).status(200)
        }).
        catch((err) => {
            return res.status(301).json({status:"not updated", err: err});
        })
    }
    catch(err){
        return res.json({status:"error", err: err})
    }
}
 
exports.userList = async(req,res) => {
    try {
        const User = await Customer.find({},{PASSWORD:0,STATUS:0,CREATED_BY:0,CREATED_DATE:0,LAST_MODIFIED_BY:0,LAST_MODIFIED_DATE:0,REFERENCE:0});

        return res.status(200).json({users:User});
    }
    catch(err) {
        return res.status(500).json({status:"Something went wrong", error: err});
    }
}

exports.Admindashboard = async(req,res) => {
    try {
        const User = await Customer.find({},{PASSWORD:0});

        return res.status(200).json({users:User});
    }
    catch(err) {
        return res.status(500).json({status:"Something went wrong", error: err});
    }
}

exports.user = async(req,res) => {
    const {userID} = req.params;
    try {
        const User = await Customer.findOne({ID:userID});
        if(!User) {
            return res.status(404).json({user:"User not found"})
        }
        return res.status(200).json({user:User})
    }
    catch(err) {
        return res.status(500).json({error:err})
    }
}
exports.deleteUser = async (req, res) => {
    const { userID } = req.params;
    try {
        // Find and delete the user
        const user = await Customer.findOneAndDelete({ ID: userID });

        if (!user) {
            return res.status(404).json({ user: "User not found" });
        }

        // Delete associated payments
        await Payment.deleteMany({ userID: userID }); // Adjust the query based on your schema

        return res.status(200).json({ message: "User and associated payments deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.userSearch = async(req,res) => {
    let {customerID, name, mobile, dob, userID} = req.query;
    let today = new Date();
    if(userID) {
        const User = await Customer.findOne({ID:userID});
        if(!User) 
            return res.status(404).json({user:"Not found"})
        const payment = await Payment.find({
            CUSTOMER_PROFILE_ID:userID,
            $expr: {
                $and: [
                    { $eq: [{ $month: "$PAYMENT_DATE" }, today.getMonth() + 1] },
                    { $eq: [{ $year: "$PAYMENT_DATE"}, today.getUTCFullYear()]}
                ]
            }
        });
        const punch = await Punch.find({
            CUSTOMER_PROFILE_ID: userID,
            $expr: {
                $and: [
                    { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                    { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                ]
            }
        });
        return res.status(200).json({user:User,payment:payment,punch:punch})
    }

    if(!name && !mobile && !dob) {
        const User = await Customer.find()
        return res.status(200).json({user:User})
    }

    customerID = customerID ? customerID : ''
    name = name ? name : '/^(?!)$/'
    mobile = mobile ? mobile : '/^(?!)$/'
    dob = dob ? dob : null

    try {
        console.log(name,mobile,dob)
        const User = await Customer.find({
            $or: [ 
                {DOB: dob},
                {NAME: {$regex: name}}, 
                {PHONE: {$regex: mobile}}
            ]
        })
        if(!User) {
            return res.status(404).json({user: "User not found"})
        }
        return res.status(200).json({user:User})
    }
    catch(err) {

    }
}

exports.nonactive = async(req,res) => {
    const {userID} = req.body;
    const user = await Customer.findOne({_id:userID});
    if(!user) 
        return res.status(404).json({status:"User not found."})
    if(user?.STATUS == 0) 
        return res.status(406).json({status:`User ${user.NAME} has already been non-active`});
    await Customer.findOneAndUpdate({_id:userID},{STATUS:0}).then(async (user) => {
        let msg = `Hi ${user.NAME},

We noticed that your payment is pending. To avoid any disruption to your access, please complete your payment as soon as possible. Until then, your account is temporarily inactivated.

Thank you,
Titanfitnessstudio
        `
        await messager(msg, user.PHONE, "non-active")
        return res.json({status:`User ${user.NAME} has been non-active. And send a notification.`})
    });
}

exports.active = async(req,res) => {
    const {userID} = req.body;
    const user = await Customer.findOne({_id:userID});
    if(user?.STATUS == 1) 
        return res.status(406).json({status:`User ${user.NAME} has already been active.`});
    await Customer.findOneAndUpdate({_id:userID},{STATUS:1}).then(async (user) => {
        await messager("Your gym account has been active now. You can enjoy our gym services.", user.PHONE, "active")
        return res.json({status:`User ${user.NAME} has been active now. You can enjoy our gym services.`})
    });
}


exports.createMeasurement = async (req, res) => {
    let { userID, height, chest, weight, shoulder, biceps, hip, leg } = req.body;

    if (!userID || !height || !chest || !weight || !shoulder || !biceps || !hip  || !leg) {
        return res.status(404).json({
            status: "All the fields are required like userID, height, chest, weight, shoulder, biceps, hip and leg"
        });
    }

    try {
        let now = new Date();

        const measurement = new CustomerMeasurement({
            userID,
            height,
            chest,
            weight,
            shoulder,
            biceps,
            hip,
            leg,
            createdDate: now
        });

        await measurement.save();

        return res.status(200).json({ status: `Measurement added for user ${userID}` });
    } catch (err) {
        return res.status(500).json({ status: "Internal Server Error", error: err.message });
    }
};

exports.getMeasurement = async (req, res) => {
    const userID = req.params.userID;  

    try {
        const measurements = await CustomerMeasurement.find({ userID });

        if (!measurements || measurements.length === 0) {
            return res.status(404).json({ status: 'Not Found', message: 'No measurements found for this user' });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Measurements retrieved successfully',
            data: measurements
        });
    } catch (err) {
        return res.status(500).json({ status: 'Error', message: err.message });
    }
};

exports.updateMeasurement = async (req, res) => {
    const { userID } = req.params;
    const { height, chest, weight, shoulder, biceps, hip ,leg} = req.body;

    if (height <= 0 || chest <= 0) {
        return res.status(400).json({ status: "Invalid height or chest value. It should be greater than zero." });
    }

    try {
        const measurement = await CustomerMeasurement.findOne({ userID });

        if (!measurement) {
            return res.status(404).json({ status: "Measurement record not found for this user." });
        }

        measurement.height = height || measurement.height;
        measurement.chest = chest || measurement.chest;
        measurement.weight = weight || measurement.weight;
        measurement.shoulder = shoulder || measurement.shoulder;
        measurement.biceps = biceps || measurement.biceps;
        measurement.hip = hip || measurement.hip;
        measurement.leg = leg || measurement.leg;


        const updatedMeasurement = await measurement.save();

        return res.status(200).json({
            status: "Measurement updated successfully",
            data: updatedMeasurement,
        });
    } catch (err) {
        return res.status(500).json({ status: "Internal Server Error", error: err.message });
    }
};


exports.deleteMeasurement = async (req, res) => {
    const { userID } = req.params; 

    try {
        const result = await CustomerMeasurement.deleteMany({ userID });

        if (result.deletedCount === 0) {
            return res.status(404).json({ status: "No measurement records found for this user." });
        }

        return res.status(200).json({ status: "All measurement records for the user deleted successfully." });
    } catch (err) {
        return res.status(500).json({ status: "Internal Server Error", error: err.message });
    }
};
