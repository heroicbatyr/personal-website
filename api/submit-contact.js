const connectToDb = require('../database/db');
const { sendContactNotification } = require('../services/contact-notification');

async function verifyTurnstile(token, remoteip) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.error('TURNSTILE_SECRET_KEY is not configured');
        return false;
    }

    const body = new URLSearchParams({ secret, response: token || '' });
    if (remoteip) body.set('remoteip', remoteip);

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });
        const result = await response.json();
        return response.ok && result.success === true;
    } catch (error) {
        console.error('Turnstile verification failed:', error.message);
        return false;
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, email, subject, message, 'cf-turnstile-response': turnstileToken } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields (Name, Email, Subject, Message) are required' });
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const remoteip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
    const turnstileValid = await verifyTurnstile(turnstileToken, remoteip);
    if (!turnstileValid) {
        return res.status(403).json({ message: 'Security check failed. Please refresh the page and try again.' });
    }

    try {
        console.time('connectToDb');
        const collection = await connectToDb('contact'); // Use 'contact' collection
        console.timeEnd('connectToDb');

        console.time('insertOne');
        const result = await collection.insertOne({
            name,
            email,
            subject,
            message,
            submittedAt: new Date()
        });
        console.timeEnd('insertOne');

        try {
            await sendContactNotification({ name, email, subject, message });
        } catch (notificationError) {
            // Preserve a successful form submission even if the mail provider is unavailable.
            console.error('Contact notification failed:', notificationError.message);
        }

        console.log('Contact submission saved:', result.insertedId);
        return res.status(200).json({ message: 'Contact submitted successfully!', id: result.insertedId });
    } catch (error) {
        console.error('Error saving to database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
