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
      // console.log('New page URL:', page.url());
      
    const titles = []
    const urlAdresses = []


      const divs = await page.$$eval('.gs_r.gs_or.gs_scl', divs => {
        // Sonuçları depolamak için bir dizi oluştur
        const results = [];
    
        // Her bir div için kontrol et
        divs.forEach(div => {
          // Div içinde pdf yazısı geçiyor mu kontrol et
          const hasPdfText = div.textContent.includes('PDF');
    
          if (hasPdfText) {
            // pdf yazısı varsa, içindeki h3 > a elemanlarını al
            const links = div.querySelectorAll('.gs_ri > h3 > a');
            links.forEach(link => {
              // Her bir linkin içeriğini ve href özelliğini alarak sonuçlara ekle
              results.push({
                text: link.textContent.trim(),
                href: link.getAttribute('href')
              });
            });
          }
        });
    
        return results;
      });
    
      // Elde edilen verileri yazdır
      divs.forEach(({text}) => titles.push(text))
      divs.forEach(({href}) => urlAdresses.push(href))
      console.log(titles)
      console.log('\n\n\n')
      console.log(urlAdresses)

    

      res.redirect('/')
  };

