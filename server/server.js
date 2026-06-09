/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

const staticPath = path.join(__dirname,'dist');
const publicPath = path.join(__dirname,'public');

if (!apiKey) {
    console.error("Warning: GEMINI_API_KEY environment variable is not set! AI endpoints will return errors.");
}

// Limit body size to 50mb
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.set('trust proxy', 1 /* number of proxies between user and server */)

// Rate limiter for AI API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}. Path: ${req.path}`);
        res.status(options.statusCode).send(options.message);
    }
});

const aiRoutes = require('./routes/ai');
app.use('/api', apiLimiter);
app.use('/api', aiRoutes);

// Serve index.html or placeholder based on file availability
app.get('/', (req, res) => {
    const placeholderPath = path.join(publicPath, 'placeholder.html');
    const indexPath = path.join(staticPath, 'index.html');

    // Attempt to serve index.html
    res.sendFile(indexPath, (err) => {
        if (err) {
            // index.html not found or unreadable, serve the original placeholder
            console.log('LOG: index.html not found or unreadable. Falling back to original placeholder.');
            res.sendFile(placeholderPath);
        }
    });
});

app.use('/public', express.static(publicPath));
app.use(express.static(staticPath));

// Start the HTTP server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`AI API routes active on /api/**`);
});
