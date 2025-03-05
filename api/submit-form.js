// api/submit-form.js
export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, phone, email } = req.body;

    // Basic validation
    if (!name || !phone || !email) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // For now, log to console (you can add a database later)
    console.log('Form submission:', { name, phone, email });

    res.status(200).json({ message: 'Form submitted successfully!' });
}