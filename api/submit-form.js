// api/submit-form.js
export default function handler(req, res) {
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

    // Log all data to Vercel console
    console.log('Form submission:', {
        fullName,
        email,
        phone,
        businessType,
        description,
        challenges,
        contactMethod,
        bestTime,
        termsOfUse
    });

    res.status(200).json({ message: 'Form submitted successfully!' });
}