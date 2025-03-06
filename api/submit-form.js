// api/submit-form.js
export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { fullName, email, phone } = req.body;

    if (!fullName || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    // Log the data to Vercel's console
    console.log('Form submission:', { fullName, email, phone });

    res.status(200).json({ message: 'Form submitted successfully!' });
}