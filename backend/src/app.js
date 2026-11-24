const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middlewares
const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}
const corsOptions = {
    origin: (origin, callback) => {
        // No Origin header: native agent, curl, or same-origin request
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Agent-Auth']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api', routes);

// Serve uploaded files (screenshots/videos) only with a valid short-lived signature.
// Private monitoring media must never be publicly accessible.
const { verifyFileSignature } = require('./utils/fileSignature');
const UPLOADS_ROOT = path.join(__dirname, '../public/uploads');
app.use('/uploads', (req, res) => {
    const canonicalPath = `/uploads${decodeURIComponent(req.path)}`;
    if (!verifyFileSignature(canonicalPath, req.query.exp, req.query.sig)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const safeRelative = path.normalize(req.path).replace(/^([/\\])+/, '');
    const absolutePath = path.join(UPLOADS_ROOT, safeRelative);
    if (!absolutePath.startsWith(UPLOADS_ROOT)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return res.sendFile(absolutePath, (err) => {
        if (err && !res.headersSent) {
            res.status(err.statusCode || 404).json({ success: false, message: 'File not found' });
        }
    });
});
app.use('/agent', express.static(path.join(__dirname, '../public/agent')));

// Redirect friendly agent setup URLs directly to agent installer download
app.get(['/setup-agent', '/download-agent', '/download'], (req, res) => {
    res.redirect('/api/agent/download');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
