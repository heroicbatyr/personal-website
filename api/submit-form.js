import connectToDb from '../../lib/db.js';  // ✅ Correct Path



export default async function handler(req, res) {
    if (req.method !== 'POST') {
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

    // Validate required fields
    if (!fullName || !email || !businessType || !bestTime || !termsOfUse) {
        return res.status(400).json({ message: 'All required fields (Full Name, Email, Business Type, Best Time, Terms of Use) are required' });
    }

    try {
        const collection = await connectToDb(); // Connect to the MongoDB collection

        // Insert form data into MongoDB
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
            submittedAt: new Date() // Timestamp when submitted
        });

        console.log('Form submission saved:', result.insertedId);

        return res.status(200).json({ message: 'Form submitted successfully!', id: result.insertedId });
    } catch (error) {
        console.error('Error saving to database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}