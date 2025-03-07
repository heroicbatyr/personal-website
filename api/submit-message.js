// api/submit-message.js
import connectToDb from '../database/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields (Name, Email, Subject, Message) are required' });
    }

    try {
        console.time('connectToDb');
        const collection = await connectToDb('messages'); // Target the 'messages' collection
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

        console.log('Message submission saved:', result.insertedId);
        return res.status(200).json({ message: 'Message submitted successfully!', id: result.insertedId });
    } catch (error) {
        console.error('Error saving to database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}