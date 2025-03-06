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

    if (!fullName || !email || !businessType || !bestTime || !termsOfUse) {
        return res.status(400).json({ message: 'All required fields are required' });
    }

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