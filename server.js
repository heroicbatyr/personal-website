const express = require('express');
require('dotenv').config(); // Add this line
const app = express();
const submitFormHandler = require('./api/submit-form');

app.use(express.json());
app.use(express.static('public'));

app.post('/api/submit-form', submitFormHandler);

const PORT = process.env.PORT || 3000; // Use env PORT or default to 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});