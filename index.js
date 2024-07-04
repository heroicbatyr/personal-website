const express = require('express');
const ipstack = require('ipstack');

const app = express();
const API_KEY = 'bb21f24501a6d58af082beae87f2d7a6'; // Replace with your actual IPStack API key

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
