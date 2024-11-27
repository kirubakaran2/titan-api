const Customer = require("../../Schema/customer");
const { messager } = require("../sender");
const mongoose = require("mongoose");
const cron = require("node-cron");

const sentBirthdayNumbers = new Set();

const birthdayWishes = async () => {
    const today = new Date();
    const todayDateString = `${today.getUTCMonth() + 1}-${today.getUTCDate()}`;

    try {
        const users = await Customer.find();

        for (const user of users) {
            const dob = new Date(user.DOB);
            const dobDateString = `${dob.getUTCMonth() + 1}-${dob.getUTCDate()}`;

            if (dobDateString === todayDateString) {
                if (sentBirthdayNumbers.has(user.PHONE)) {
                    console.log(`Birthday wish already sent to: ${user.NAME}`);
                    continue;
                }

                const msg = `Happy Birthday, ${user.NAME}! 🎉🎂
                
                Wishing you a wonderful day filled with joy and happiness. Thank you for being a part of our Titan Fitness family!

                Best wishes,
                Titanfitnessstudio`;

                await messager(msg, user.PHONE, 'birthday wish');
                console.log(`Sent birthday wish to: ${user.NAME}`);

                sentBirthdayNumbers.add(user.PHONE);

                user.lastBirthdayWishSent = today;
                await user.save();
            }
        }
    } catch (err) {
        console.error("Error sending birthday wishes:", err);
    }
};
cron.schedule("5 9 * * *", () => {
    console.log("Running daily birthday wish check...");
    sentBirthdayNumbers.clear();
    birthdayWishes();
});
exports.birthdayWishes = birthdayWishes;
