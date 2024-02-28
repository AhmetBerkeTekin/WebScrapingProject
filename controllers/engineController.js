const puppeteer = require('puppeteer');

exports.scholarSearch = async (req, res) => {
    console.log(req.body.keyword)
    const keyword = req.body.keyword
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
  
      // Navigate the page to a URL
      await page.goto('https://scholar.google.com');
  
      // Set screen size
      await page.setViewport({width: 1080, height: 1024});
  
      await page.type('input[name="q"]', keyword); 
      
      // evalue input[type=submit] before click
      const submitBtn = await page.$('button[type=submit]');
      await submitBtn.evaluate(btn => btn.click());
  
  
      // console log the next page results
      await page.waitForNavigation();
      console.log('New page URL:', page.url());

      res.redirect('/')
  };

