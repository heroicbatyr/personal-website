const express = require('express');
const ipstack = require('ipstack');

const app = express();
const API_KEY = process.env.IPSTACK_API_KEY;

if (!API_KEY) {
    throw new Error('IPSTACK_API_KEY is not defined');
}

app.use(express.json());

// Middleware to capture IP and fetch location
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ipstack(ip, API_KEY, (err, response) => {
        if (err) {
            console.error(err);
            req.location = null;
        } else {
            req.location = response;
        }
        next();
    });
});

// Example endpoint to send location data to frontend
app.get('/visitor-info', (req, res) => {
    res.json({
        ip: req.ip,
        location: req.location
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
