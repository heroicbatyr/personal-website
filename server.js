const express = require('express');
require('dotenv').config();

const app = express();
const submitFormHandler = require('./api/submit-form');
const submitContactHandler = require('./api/submit-contact');
const submitHrHandler = require('./api/submit-hr');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/api/submit-form', submitFormHandler);
app.post('/api/submit-contact', submitContactHandler);
app.post('/api/submit-hr', submitHrHandler);

// Match Vercel's catch-all rewrite for client-facing routes.
app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

const PORT = process.env.PORT || 3000; // Use env PORT or default to 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
