import connectToDb from '../database/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { fullName, email, phone, businessType, description, contactMethod, bestTime, termsOfUse } = req.body;

    if (!fullName || !email || !businessType || !bestTime || !termsOfUse) {
        return res.status(400).json({ message: 'All required fields (Full Name, Email, Company Name, Best Time, Terms of Use) are required' });
    }

    try {
        console.time('connectToDb');
        const collection = await connectToDb('hr'); // Targets test.hr
        console.timeEnd('connectToDb');

        console.time('insertOne');
        const result = await collection.insertOne({
            fullName,
            email,
            phone,
            businessType,
            description,
            contactMethod,
            bestTime,
            termsOfUse,
            submittedAt: new Date()
        });
        console.timeEnd('insertOne');

        console.log('HR submission saved:', result.insertedId);
        return res.status(200).json({ message: 'HR form submitted successfully!', id: result.insertedId });
    } catch (error) {
        console.error('Error saving to database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}