const connectToDb = require('../database/db');
const { sendContactNotification } = require('../services/contact-notification');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields (Name, Email, Subject, Message) are required' });
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
