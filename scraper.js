import puppeteer from 'puppeteer';

let browser = null;
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
  }
  return browser;
}

export async function searchProducts(query, page = 1) {
  const cacheKey = `search:${query}:${page}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.data, cached: true };
  }

  const browserInstance = await getBrowser();
  const browserPage = await browserInstance.newPage();
  
  try {
    await browserPage.setViewport({ width: 1920, height: 1080 });
    
    const searchUrl = `https://www.toolstation.com/search?q=${encodeURIComponent(query)}&page=${page}`;
    await browserPage.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const products = await browserPage.evaluate(() => {
      const results = [];
      const seenProducts = new Set();
      
      const allDivs = Array.from(document.querySelectorAll('div, article, section'));
      
      allDivs.forEach((div) => {
        const text = div.textContent || '';
        const productCodeMatch = text.match(/Product code:\s*(\w+)/);
        
        if (productCodeMatch && text.length < 1000) {
          const productCode = productCodeMatch[1];
          
          if (seenProducts.has(productCode)) return;
          seenProducts.add(productCode);
          
          const links = div.querySelectorAll('a[href*="/p"]');
          let title = '';
          links.forEach((link) => {
            const linkText = link.textContent?.trim() || '';
            if (linkText.length > title.length && linkText.length > 10 && !linkText.includes('Add to')) {
              title = linkText;
            }
          });
          
          const priceMatch = text.match(/£([\d,]+\.?\d*)\s+ex\.\s*VAT\s+£([\d,]+\.?\d*)/);
          
          const reviewMatch = text.match(/\((\d+)\)/);
          const reviews = reviewMatch ? parseInt(reviewMatch[1]) : 0;
          
          const img = div.querySelector('img');
          let image = null;
          if (img) {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            if (src && !src.includes('icon') && !src.includes('logo')) {
              image = src;
            }
          }
          
          const brandMatch = title.match(/^([A-Z][A-Za-z\s&]+?)(?:\s+[A-Z0-9]|$)/);
          const brand = brandMatch ? brandMatch[1].trim() : null;
          
          let url = '';
          links.forEach((link) => {
            const href = link.getAttribute('href') || '';
            if (href.includes(`/p${productCode}`)) {
              url = `https://www.toolstation.com${href}`;
            }
          });
          
          if (title && priceMatch && url) {
            results.push({
              productCode,
              title,
              brand,
              price: `£${priceMatch[1]}`,
              priceExVAT: `£${priceMatch[2]}`,
              reviews,
              image,
              url,
            });
          }
        }
      });
      
      const totalText = document.body.textContent || '';
      const totalMatch = totalText.match(/(\d+)\s*results/i) || totalText.match(/(\d+)\s*-\s*\d+\s+of\s+(\d+)/i);
      const total = totalMatch ? parseInt(totalMatch[totalMatch.length - 1]) : results.length;
      
      return { results, total };
    });
    
    await browserPage.close();
    
    const result = {
      ...products,
      cached: false,
      query,
      page,
    };
    
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    await browserPage.close();
    throw error;
  }
}

export async function getProductDetails(productCode) {
  const cacheKey = `product:${productCode}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.data, cached: true };
  }

  const browserInstance = await getBrowser();
  const browserPage = await browserInstance.newPage();
  
  try {
    await browserPage.setViewport({ width: 1920, height: 1080 });
    
    // Find product URL by searching
    const searchResult = await searchProducts(productCode, 1);
    const product = searchResult.results.find(p => p.productCode === productCode);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    await browserPage.goto(product.url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const details = await browserPage.evaluate(() => {
      const text = document.body.textContent || '';
      
      // Extract price
      const priceMatch = text.match(/£([\d,]+\.?\d*)\s+ex\.\s*VAT\s+£([\d,]+\.?\d*)/);
      
      // Extract rating
      const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*\/\s*5/);
      const rating = ratingMatch ? ratingMatch[1] : null;
      
      // Extract images
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => img.src || img.getAttribute('data-src'))
        .filter(src => src && src.includes('toolstation.com') && !src.includes('icon') && !src.includes('logo'))
        .slice(0, 10);
      
      return {
        price: priceMatch ? `£${priceMatch[1]}` : null,
        priceExVAT: priceMatch ? `£${priceMatch[2]}` : null,
        rating,
        images,
      };
    });
    
    await browserPage.close();
    
    const result = {
      ...product,
      ...details,
      cached: false,
    };
    
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    await browserPage.close();
    throw error;
  }
}

export async function clearCache() {
  cache.clear();
  return { success: true, message: 'Cache cleared' };
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
