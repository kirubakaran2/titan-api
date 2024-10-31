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
 * Safely extracts both message and image content from various input types
 * @param {any} messageInput - Input message content
 * @param {any} imageInput - Input image content
 * @returns {Object} Object containing extracted message and image strings
 */

function extractimageContent(req) {
    console.log('Input for extractImageContent:', req); // Debug log

    let message = '';
    let image = '';

    // Handle Express request object
    if (req && req.body) {
        // Extract message
        if (typeof req.body.message === 'string') {
            message = req.body.message;
        }
        
        // Extract image
        if (typeof req.body.image === 'string') {
            image = req.body.image;
        }
    } else if (typeof req === 'string') {
        // Handle direct string input
        message = req;
    } else if (req && typeof req === 'object') {
        // Handle plain object input
        if (typeof req.message === 'string') {
            message = req.message;
        }
        if (typeof req.image === 'string') {
            image = req.image;
        }
    }

    return {
        message: message || 'Message content unavailable',
        image: image || 'Image content unavailable'
    };
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
 * Sends an SMS with an image to all active customers
 * @param {any} message - Message content
 * @param {any} image - Image content
 * @param {string} reason - Purpose of the message
 * @param {boolean} [sendToAll=true] - Whether to send to all customers
 * @returns {Promise<{success: boolean, results: Array, count: number}>} - Returns success status, results, and count of messages sent
 */
exports.sendimage = async (message, image, reason, sendToAll = true) => {
    const results = [];
    const sentPhones = new Set(); // Track sent phone numbers
    let totalSent = 0; // Count of total messages sent

    try {
        const { message: messageContent, image: imageContent } = extractimageContent(message, image);
        
        if (!messageContent || !imageContent) {
            throw new Error('Invalid message or image content');
        }

        if (sendToAll) {
            // Fetch all active customers
            const customers = await Customer.find({ STATUS: 1 });
            console.log(`Found ${customers.length} active customers`);

            for (const customer of customers) {
                console.log(`Processing customer: ${customer.NAME}, Phone: ${customer.PHONE}`); // Debug log

                if (!customer.PHONE) {
                    results.push({
                        phone: 'No phone number',
                        name: customer.NAME,
                        success: false,
                        error: 'No phone number available'
                    });
                    continue;
                }

                const cleanPhone = validatePhone(customer.PHONE);

                // Skip if already sent
                if (sentPhones.has(cleanPhone)) {
                    console.log(`Skipping duplicate phone number: ${cleanPhone}`);
                    continue;
                }

                try {
                    await sendimageWithRetry(cleanPhone, messageContent, imageContent, reason);
                    sentPhones.add(cleanPhone); // Mark as sent
                    results.push({
                        phone: cleanPhone,
                        name: customer.NAME,
                        success: true
                    });
                    totalSent++; // Increment total sent count
                } catch (error) {
                    console.error(`Error sending to ${cleanPhone}: ${error.message}`);
                    results.push({
                        phone: cleanPhone,
                        name: customer.NAME,
                        success: false,
                        error: error.message
                    });
                }

                // Throttle requests to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        return {
            success: true,
            results: results,
            count: totalSent // Include count of messages sent
        };
    } catch (error) {
        console.error(`Error in sendimage: ${error.message}`);
        return {
            success: false,
            error: error.message,
            results: [],
            count: totalSent // Return count even on error
        };
    }
};



/**
 * Attempts to send an SMS multiple times before giving up
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content
 * @param {any} image - Message content
 * @param {string} reason - Purpose of the message
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<void>}
 */
async function sendimageWithRetry(phone, message,image, reason, retries = 3) {
    let lastError;
    const cleanPhone = validatePhone(phone);

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const requestData = {
                phone: cleanPhone,
                message: message,
                image:image
            };

            console.log(`Attempt ${attempt} - Sending data:`, requestData);

            const response = await fetch("http://54.226.31.192:8080/sendImage", {
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

    throw lastError || new Error('Failed to send image & message after all retries');
}