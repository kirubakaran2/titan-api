const Customer = require('../Schema/customer')
const Admin = require("../Schema/admin")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const {messager} = require("./sender")
require("dotenv").config();

exports.login = async(req,res) => {
    let {email,password} = req.body;
    console.log(email,password);
    let secret = process.env.SECRET || '12345'
    try {
        const admin = await Admin.findOne({EMAIL:email});
        if(admin) {
            if(bcrypt.compareSync(password,admin.PASSWORD)){
                let token = jwt.sign({
                    id: admin.ID,
                    name: admin.NAME,
                    email: admin.EMAIL,
                    role:"admin"
                },secret,{expiresIn: '18hrs'});
                return res.status(200).json({token:token,status:"Success"})
            }
            else {
                return res.status(401).json({status:"Invalid password"})
            }
        }
        const user = await Customer.findOne({EMAIL:email});
        if(!user) {
            return res.status(404).json({status:"Email not found",email:email})
        }
        if(bcrypt.compareSync(password, user.PASSWORD)) {
            let token = jwt.sign({
                id:user.ID,
                name:user.NAME,
                email: user.EMAIL,
                role:'customer'
            },secret,{expiresIn: '18hrs'})
            if(user.STATUS == 0)
                messager("Your membership has been non-active, you have to payment as soon as possible.", user.PHONE, "Login without payment")
            return res.status(200).json({token:token,status:"Success"})
        }
        else {
            return res.status(401).json({status:"Invalid password"})
        }
    }
    catch(err) {
        return res.status(500).json({status:"Internal Server Error.",error:err})
    }
}

exports.admin = async(req,res) => {
    let {name, dob, phone, email, address, image, password,role} = req.body;
    if(role !== 'admin') {
        return res.status(404).json({status:"Admin user can only created by this endpoint."})
    }
    let user = await Admin.findOne({EMAIL:email})
    if(user) {
        return res.status(301).json({status:"Email already found"})
    }
    try {
        let encPwd = bcrypt.hashSync(password,5)
    
        let count = await Admin.countDocuments();
        let newUser = new Admin({
            ID: count+1,
            NAME:name,
            DOB:dob,
            PHONE:phone,
            EMAIL:email,
            ADDRESS:address,
            IMAGE_PATH:image,
            ROLE:'admin',
            PASSWORD:encPwd
        });
    
        newUser.save().then(() => {
            return res.status(200).json({status:"Created new admin."})
        }).catch(() => {
            return res.status(500).json({status:"Internal Server Error."})
        })
    }
    catch(err) {
        return res.status(500).json({status:"Internal Server Error."})
    }
}