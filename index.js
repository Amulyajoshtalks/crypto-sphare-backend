require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with specific options
app.use(cors({
  origin: 'https://crypto-sphare-frontend.vercel.app/', // Allow your frontend origin
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow cookies
}));

// Handle preflight requests
app.options('*', cors());

// API key from environment variables
const API_KEY = process.env.COINMARKETCAP_API_KEY;

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Proxy endpoint for cryptocurrency listings
app.get('/api/cryptocurrencies', async (req, res) => {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      params: {
        start: 1,
        limit: 100,
        convert: 'USD',
        ...req.query
      },
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch cryptocurrency data',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for currency conversion
app.get('/api/convert', async (req, res) => {
  try {
    const { source, amount, target } = req.query;
    
    if (!source || !amount || !target) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/tools/price-conversion', {
      params: {
        amount,
        symbol: source,
        convert: target
      },
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Conversion error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Conversion failed',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`CORS-enabled for http://localhost:5173`);
});