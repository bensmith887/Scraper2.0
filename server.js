import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchProducts, getProductDetails, clearCache } from './scraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6';

// Middleware
app.use(cors());
app.use(express.json());

// API Key authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Tool Station Scraper API',
    version: '1.0.0',
    endpoints: {
      search: 'POST /api/search',
      product: 'GET /api/product/:productCode',
      clearCache: 'POST /api/cache/clear',
    },
    documentation: 'See README.md for usage instructions',
  });
});

// Search products
app.post('/api/search', authenticate, async (req, res) => {
  try {
    const { query, page = 1 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const results = await searchProducts(query, page);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search products', message: error.message });
  }
});

// Get product details
app.get('/api/product/:productCode', authenticate, async (req, res) => {
  try {
    const { productCode } = req.params;
    
    if (!productCode) {
      return res.status(400).json({ error: 'Product code is required' });
    }
    
    const product = await getProductDetails(productCode);
    res.json(product);
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({ error: 'Failed to get product details', message: error.message });
  }
});

// Clear cache
app.post('/api/cache/clear', authenticate, async (req, res) => {
  try {
    const result = await clearCache();
    res.json(result);
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache', message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Scraper API running on port ${PORT}`);
  console.log(`📝 API Key: ${API_KEY.substring(0, 10)}...`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
