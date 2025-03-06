// server.js
const express = require('express');
const app = express();
const submitFormHandler = require('./api/submit-form');

app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve static files from 'public' folder

app.post('/api/submit-form', submitFormHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});