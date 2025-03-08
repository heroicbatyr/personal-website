import connectToDb from '../database/db.js';

export default async function handler(req, res) {
    console.log('Request hit /api/submit-form:', req.method, req.body); // Log every request

    if (req.method !== 'POST') {
        console.log('Method not allowed:', req.method);
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const {
        fullName,
        email,
        phone,
        businessType,
        description,
        challenges,
        contactMethod,
        bestTime,
        termsOfUse
    } = req.body;

    console.log('Parsed body:', { fullName, email, businessType, bestTime, termsOfUse });

    if (!fullName || !email || !businessType || !bestTime || !termsOfUse) {
        console.log('Missing required fields');
        return res.status(400).json({ message: 'All required fields (Full Name, Email, Business Type, Best Time, Terms of Use) are required' });
    }

    try {
        console.time('connectToDb');
        const collection = await connectToDb();
        console.timeEnd('connectToDb');

        console.time('insertOne');
        const result = await collection.insertOne({
            fullName,
            email,
            phone,
            businessType,
            description,
            challenges,
            contactMethod,
            bestTime,
            termsOfUse,
            submittedAt: new Date()
        });
        console.timeEnd('insertOne');

        console.log('Form submission saved:', result.insertedId);
        return res.status(200).json({ message: 'Form submitted successfully!', id: result.insertedId });
    } catch (error) {
        console.error('Error saving to database:', error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}