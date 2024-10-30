const fetch = require("node-fetch");
const Message = require("../Schema/messages");
const Customer = require("../Schema/customer"); // Add this line to import Customer model

/**
 * Safely extracts message content from various input types
 * @param {any} input - Input message content
 * @returns {string} Extracted message string
 */
function extractMessageContent(input) {
    // If input is a string, return it directly
    if (typeof input === 'string') {
        return input;
    }

    // If input is an Express request object or similar
    if (input && typeof input === 'object') {
        // Check for common message properties
        if (input.body && typeof input.body.message === 'string') {
            return input.body.message;
        }
        if (input.message && typeof input.message === 'string') {
            return input.message;
        }
        if (input.text && typeof input.text === 'string') {
            return input.text;
        }
        
        try {
            const simpleObject = {
                ...(input.body?.content && { content: input.body.content }),
                ...(input.content && { content: input.content }),
                ...(input.body?.text && { text: input.body.text })
            };
            
            if (Object.keys(simpleObject).length > 0) {
                return JSON.stringify(simpleObject);
            }
        } catch (e) {
            console.warn('Failed to stringify object:', e.message);
        }
    }

    return 'Message content unavailable';
}

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {string} Cleaned phone number
 */
function validatePhone(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        throw new Error('Invalid phone number format');
    }
    return cleanPhone;
}

/**
 * Sends a message to a specified phone number and saves it to the database
 * @param {any} body - Message content
 * @param {string} to - Recipient phone number
 * @param {string} reason - Purpose of the message
 * @returns {Promise<boolean>} - Returns true if successful
 */
exports.messager = async (body, to, reason) => {
    try {
        const messageContent = extractMessageContent(body);
        const cleanPhone = validatePhone(to);

        console.log('Sending message:', {
            phone: cleanPhone,
            messageContent,
            reason
        });

        const requestData = {
            phone: cleanPhone,
            message: messageContent
        };

        const response = await fetch("http://54.226.31.192:8080/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}. Response: ${responseText}`);
        }

        const record = new Message({
            phone: cleanPhone,
            message: messageContent,
            time: new Date(),
            reason: reason
        });

        await record.save();
        return true;
    } catch (error) {
        console.error(`Error sending message to ${to}: ${error.message}`);
        throw error;
    }
};

/**
 * Sends an SMS to all active customers or a specific phone number
 * @param {any} message - Message content
 * @param {string} reason - Purpose of the message
 * @param {boolean} [sendToAll=false] - Whether to send to all customers
 * @returns {Promise<{success: boolean, results: Array}>} - Returns success status and results
 */
exports.sendsms = async (message, reason, sendToAll = false) => {
    try {
        const messageContent = extractMessageContent(message);
        const results = [];
        const sentPhones = new Set(); // Track sent phone numbers

        if (sendToAll) {
            // Fetch all active customers
            const customers = await Customer.find({ STATUS: 1 });
            console.log(`Found ${customers.length} active customers`);

            // Send messages to all customers
            for (const customer of customers) {
                if (!customer.PHONE) {
                    results.push({
                        phone: 'No phone number',
                        name: customer.NAME,
                        success: false,
                        error: 'No phone number available'
                    });
                    continue;
                }

                if (sentPhones.has(customer.PHONE)) {
                    continue; // Skip if already sent
                }

                try {
                    await sendSMSWithRetry(customer.PHONE, messageContent, reason);
                    sentPhones.add(customer.PHONE); // Mark as sent
                    results.push({
                        phone: customer.PHONE,
                        name: customer.NAME,
                        success: true
                    });

                } catch (error) {
                    results.push({
                        phone: customer.PHONE,
                        name: customer.NAME,
                        success: false,
                        error: error.message
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } else {
            // Send to default number
            const phoneNumber = "9361222503";
            if (!sentPhones.has(phoneNumber)) {
                await sendSMSWithRetry(phoneNumber, messageContent, reason);
                sentPhones.add(phoneNumber);
                results.push({
                    phone: phoneNumber,
                    success: true
                });
            }
        }

        return {
            success: true,
            results: results
        };

    } catch (error) {
        console.error(`Error in sendsms: ${error.message}`);
        return {
            success: false,
            error: error.message,
            results: []
        };
    }
};


/**
 * Attempts to send an SMS multiple times before giving up
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content
 * @param {string} reason - Purpose of the message
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<void>}
 */
async function sendSMSWithRetry(phone, message, reason, retries = 3) {
    let lastError;
    const cleanPhone = validatePhone(phone);

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const requestData = {
                phone: cleanPhone,
                message: message
            };

            console.log(`Attempt ${attempt} - Sending data:`, requestData);

            const response = await fetch("http://54.226.31.192:8080/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                console.log(`Message sent successfully to ${cleanPhone} on attempt ${attempt}`);
                return;
            }

            const responseText = await response.text();
            lastError = new Error(`HTTP error! status: ${response.status} ${response.statusText}. Response: ${responseText}`);
            
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed for ${cleanPhone}: ${error.message}`);
            
            if (attempt < retries) {
                const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Failed to send message after all retries');
}
/**
 * Sends an image to all active customers or a specific phone number
 * @param {any} image - Image data (e.g. Buffer, base64 string, etc.)
 * @param {string} reason - Purpose of the message
 * @param {boolean} [sendToAll=false] - Whether to send to all customers
 * @returns {Promise<{success: boolean, results: Array}>} - Returns success status and results
 */
exports.sendimage = async (image, reason, sendToAll = false) => {
    try {
        const results = [];
        const sentPhones = new Set(); // Track sent phone numbers

        if (sendToAll) {
            // Fetch all active customers
            const customers = await Customer.find({ STATUS: 1 });
            console.log(`Found ${customers.length} active customers`);

            // Send images to all customers
            for (const customer of customers) {
                if (!customer.PHONE) {
                    results.push({
                        phone: 'No phone number',
                        name: customer.NAME,
                        success: false,
                        error: 'No phone number available'
                    });
                    continue;
                }

                if (sentPhones.has(customer.PHONE)) {
                    continue; // Skip if already sent
                }

                try {
                    const cleanPhone = validatePhone(customer.PHONE);
                    await sendImageWithRetry(cleanPhone, image, reason);
                    sentPhones.add(cleanPhone); // Mark as sent
                    results.push({
                        phone: cleanPhone,
                        name: customer.NAME,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        phone: customer.PHONE,
                        name: customer.NAME,
                        success: false,
                        error: error.message
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } else {
            // Send to default number
            const phoneNumber = "9361222503";
            if (!sentPhones.has(phoneNumber)) {
                await sendImageWithRetry(phoneNumber, image, reason);
                sentPhones.add(phoneNumber);
                results.push({
                    phone: phoneNumber,
                    success: true
                });
            }
        }

        return {
            success: true,
            results: results
        };
    } catch (error) {
        console.error(`Error in sendimage: ${error.message}`);
        return {
            success: false,
            error: error.message,
            results: []
        };
    }
};

/**
 * Attempts to send an image multiple times before giving up
 * @param {string} phone - Recipient phone number
 * @param {any} image - Image data (e.g. Buffer, base64 string, etc.)
 * @param {string} reason - Purpose of the message
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<void>}
 */
async function sendImageWithRetry(phone, image, reason, retries = 3) {
    let lastError;
    const cleanPhone = validatePhone(phone);

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const requestData = {
                phone: cleanPhone,
                image: image
            };

            console.log(`Attempt ${attempt} - Sending image data:`, requestData);

            const response = await fetch("http://54.226.31.192:8080/sendImage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                console.log(`Image sent successfully to ${cleanPhone} on attempt ${attempt}`);
                return;
            }

            const responseText = await response.text();
            lastError = new Error(`HTTP error! status: ${response.status} ${response.statusText}. Response: ${responseText}`);
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed for ${cleanPhone}: ${error.message}`);

            if (attempt < retries) {
                const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Failed to send image after all retries');
}