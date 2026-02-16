# Tool Station Scraper API

A standalone REST API for scraping Tool Station product data, designed to be deployed on Railway and consumed by Lovable apps.

## Features

- Search Tool Station products
- Get detailed product information
- Built-in caching (1 hour)
- API key authentication
- CORS enabled for web apps
- Ready for Railway deployment

## API Endpoints

### Health Check
```
GET /
```
Returns API status and available endpoints.

### Search Products
```
POST /api/search
Headers: x-api-key: YOUR_API_KEY
Body: {
  "query": "drill",
  "page": 1
}
```

Response:
```json
{
  "results": [
    {
      "productCode": "60545",
      "title": "DeWalt DCD709D2T-GB 18V XR Brushless Compact Combi Drill",
      "brand": "DeWalt",
      "price": "£119.98",
      "priceExVAT": "£99.98",
      "reviews": 45,
      "image": "https://...",
      "url": "https://www.toolstation.com/..."
    }
  ],
  "total": 1536,
  "cached": false,
  "query": "drill",
  "page": 1
}
```

### Get Product Details
```
GET /api/product/:productCode
Headers: x-api-key: YOUR_API_KEY
```

Response:
```json
{
  "productCode": "60545",
  "title": "DeWalt DCD709D2T-GB 18V XR Brushless Compact Combi Drill",
  "brand": "DeWalt",
  "price": "£119.98",
  "priceExVAT": "£99.98",
  "rating": "5.0",
  "reviews": 45,
  "images": ["https://...", "https://..."],
  "url": "https://www.toolstation.com/...",
  "cached": false
}
```

### Clear Cache
```
POST /api/cache/clear
Headers: x-api-key: YOUR_API_KEY
```

## Deploy to Railway

### Step 1: Push to GitHub

1. Create a new GitHub repository
2. Push this code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/scraper-api.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the configuration

### Step 3: Add Environment Variable

1. Go to your project settings
2. Click "Variables"
3. Add:
   - Key: `API_KEY`
   - Value: `ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6`

### Step 4: Get Your API URL

Once deployed, Railway will give you a URL like:
```
https://scraper-api-production.up.railway.app
```

## Use in Lovable App

### Install Dependencies
```bash
npm install axios
```

### Create API Client
```typescript
// lib/scraperApi.ts
import axios from 'axios';

const API_URL = 'https://your-railway-url.up.railway.app';
const API_KEY = 'ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'x-api-key': API_KEY,
  },
});

export async function searchProducts(query: string, page: number = 1) {
  const response = await api.post('/api/search', { query, page });
  return response.data;
}

export async function getProductDetails(productCode: string) {
  const response = await api.get(`/api/product/${productCode}`);
  return response.data;
}

export async function clearCache() {
  const response = await api.post('/api/cache/clear');
  return response.data;
}
```

### Use in Components
```typescript
import { searchProducts } from './lib/scraperApi';

function ProductSearch() {
  const [results, setResults] = useState(null);
  
  const handleSearch = async (query: string) => {
    const data = await searchProducts(query);
    setResults(data);
  };
  
  return (
    // Your UI here
  );
}
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
API_KEY=ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6
PORT=3000
```

3. Run the server:
```bash
npm start
```

4. Test the API:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "x-api-key: ts_b068d82c580c157d0b23a256c8e092385e67fb061f564c5df71c3b22440904a6" \
  -H "Content-Type: application/json" \
  -d '{"query":"drill"}'
```

## Important Notes

### Tool Station Blocking
Tool Station may block automated scraping attempts with 502 errors. If this happens:

1. **Use proxies**: Add proxy rotation to bypass blocks
2. **Rate limiting**: Add delays between requests
3. **Alternative sites**: Scrape other e-commerce sites instead
4. **Commercial services**: Use Bright Data, ScraperAPI, etc.

### Performance
- First request may take 10-15 seconds (browser startup)
- Cached requests return instantly
- Cache expires after 1 hour

### Costs
- **Railway Free Tier**: $5 credit/month (enough for testing)
- **Railway Paid**: ~$5-10/month for production use
- Much cheaper than commercial scraping services

## Security

- API key is required for all endpoints
- Never commit `.env` file to Git
- Rotate API keys periodically
- Use HTTPS in production (Railway provides this automatically)

## Troubleshooting

### 502 Errors
Tool Station is blocking the scraper. Try:
- Adding delays between requests
- Using residential proxies
- Scraping during off-peak hours

### Timeout Errors
Increase timeout in scraper.js:
```javascript
timeout: 60000 // 60 seconds
```

### Memory Issues
Railway may kill the process if it uses too much memory. Add to server.js:
```javascript
// Close browser after each request
await closeBrowser();
```

## License

MIT
