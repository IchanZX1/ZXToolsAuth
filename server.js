const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const OrderKuota = require('./orkut/orkut-login.js');
const OrderKuotaMutasi = require('./orkut/Mutasi.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiter to prevent hacker/ddos attacks
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: { success: false, error: "Too many requests from this IP, please try again after 5 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all /api routes
app.use('/api/', apiLimiter);

// API Endpoint
app.post('/api/execute', async (req, res) => {
    try {
        const { action, username, authToken, params = {} } = req.body;

        if (!action) {
            return res.status(400).json({ success: false, error: "Parameter 'action' is required." });
        }

        // Initialize the OOP class OrderKuota from the previous step
        // We fallback to your default credentials if the user doesn't provide them, 
        // but for security they can provide their own.
        const defaultUser = "ichanzx";
        const defaultAuth = "2235420:YZCh9MKTDAX6yWE4Nt2joaf1dw5ikJxP";

        const instanceUsername = username || defaultUser;
        const instanceAuthToken = authToken || defaultAuth;

        const orkut = new OrderKuota(instanceUsername, instanceAuthToken);

        const response = await orkut.execute(action, params);

        res.json({ success: true, data: response });
    } catch (error) {
        console.error(`[API Error] Action: ${req.body.action}`, error.message);
        let errorMessage = error.message;

        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }

        res.status(500).json({ success: false, error: errorMessage });
    }
});

// New Dedicated Mutasi Endpoint
app.post('/api/mutasi', async (req, res) => {
    try {
        const { username, authToken, proxy } = req.body;

        const defaultUser = "ichanzx";
        const defaultAuth = "2235420:YZCh9MKTDAX6yWE4Nt2joaf1dw5ikJxP";

        const instanceUsername = username || defaultUser;
        const instanceAuthToken = authToken || defaultAuth;

        const mutasiService = new OrderKuotaMutasi(instanceUsername, instanceAuthToken, proxy);
        const result = await mutasiService.fetchMutasi();

        if (result.status) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error(`[API Error] Mutasi:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`[+] ZX-Tools Auth Server is running on http://localhost:${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;
