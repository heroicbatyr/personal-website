// server.js
const express = require('express');
const app = express();
const submitFormHandler = require('./api/submit-form');

app.use(express.json());
app.use(express.static('public')); // Serve files from public/

app.post('/api/submit-form', submitFormHandler);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});