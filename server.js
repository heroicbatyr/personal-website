const express = require('express');
require('dotenv').config();

const app = express();
const submitFormHandler = require('./api/submit-form');
const submitContactHandler = require('./api/submit-contact');
const submitHrHandler = require('./api/submit-hr');
const financeApiUrl = process.env.FINANCE_API_URL || 'http://finance-service:8080';

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/api/submit-form', submitFormHandler);
app.post('/api/submit-contact', submitContactHandler);
app.post('/api/submit-hr', submitHrHandler);

// Keep Cloudflare pointed at this container and forward only stock API traffic
// to the private Spring Boot service on the Docker network.
app.use(['/api/stocks', '/api/finance'], async (req, res) => {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 45000);
    try {
        const target = new URL(req.originalUrl, financeApiUrl);
        const headers = { accept: 'application/json' };
        if (req.headers.origin) headers.origin = req.headers.origin;

        const upstream = await fetch(target, {
            method: req.method,
            headers,
            signal: abortController.signal
        });
        for (const header of ['content-type', 'access-control-allow-origin', 'access-control-allow-methods',
            'access-control-allow-headers', 'access-control-max-age', 'vary']) {
            const value = upstream.headers.get(header);
            if (value) res.set(header, value);
        }
        const body = Buffer.from(await upstream.arrayBuffer());
        return res.status(upstream.status).send(body);
    } catch (error) {
        console.error('Finance API proxy unavailable:', error.name);
        return res.status(502).json({
            message: 'The stock-data service is temporarily unavailable.'
        });
    } finally {
        clearTimeout(timeout);
    }
});

// Match Vercel's catch-all rewrite for client-facing routes.
app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

const PORT = process.env.PORT || 3000; // Use env PORT or default to 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
