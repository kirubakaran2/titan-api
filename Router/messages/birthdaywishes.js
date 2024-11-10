const Customer = require("../../Schema/customer");
const { messager } = require("../sender"); 
const mongoose = require("mongoose");
const cron = require("node-cron");

const birthdayWishes = async () => {
    const today = new Date();
    const todayDateString = `${today.getUTCMonth() + 1}-${today.getUTCDate()}`;

    try {
        const users = await Customer.find(); 

        users.forEach(async (user) => {
            const dob = new Date(user.DOB);
            const dobDateString = `${dob.getUTCMonth() + 1}-${dob.getUTCDate()}`;
            if (dobDateString === todayDateString) {
                if (!user.lastBirthdayWishSent || new Date(user.lastBirthdayWishSent).toDateString() !== today.toDateString()) {
                    const msg = `Happy Birthday, ${user.NAME}! 🎉🎂
                    
                    Wishing you a wonderful day filled with joy and happiness. Thank you for being a part of our Titan Fitness family!

                    Best wishes,
                    Titanfitnessstudio`;

                    await messager(msg, user.PHONE, 'birthday wish');
                    console.log(`Sent birthday wish to: ${user.NAME}`);
                    user.lastBirthdayWishSent = today;
                    await user.save();
                }
            }
        });
    } catch (err) {
        console.error("Error sending birthday wishes:", err);
    }
};
cron.schedule("0 9 * * *", () => {
    console.log("Running daily birthday wish check...");
    birthdayWishes();
});

exports.birthdayWishes = birthdayWishes;