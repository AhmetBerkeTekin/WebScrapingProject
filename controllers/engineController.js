const puppeteer = require('puppeteer')

const https = require('https')
const http = require('http')
const fs = require('fs')
const axios = require('axios');
const Typo = require("typo-js");
var dictionary = new Typo('en_US');
const downloadPath =
  'C:\\Kodlamalar\\JavaScriptCodes\\WebScrapingProject\\public\\PDFFiles\\'
 
exports.scholarSearch = async (req, res) => {
  process.setMaxListeners(20)
  console.log(req.body.keyword)
  var keyword = ""
  var isSpelledCorrectly = dictionary.check(req.body.keyword)
  if(!isSpelledCorrectly){
    console.log("Burdayız")
      var array = dictionary.suggest(req.body.keyword)
      if(array.length != 0){
        var originalWord = req.body.keyword;
        var closestMatch;
        var maxSimilarity = -1;
        array.forEach(function(suggestedWord) {
          var similarity = 0;
          for (var i = 0; i < originalWord.length; i++) {
              if (originalWord[i] === suggestedWord[i]) {
                  similarity++;
              }
          }
          if (similarity > maxSimilarity) {
              maxSimilarity = similarity;
              closestMatch = suggestedWord;
          }
      });
      keyword = closestMatch
      }
      else{
        keyword = req.body.keyword
      }
  }
  else{
    keyword = req.body.keyword
  }
  
  console.log(keyword)
  
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto('https://dergipark.org.tr/tr/')

  await page.setViewport({ width: 1080, height: 1024 })

  await page.type('input[name="q"]', keyword)

  const submitBtn = await page.$('button[id=home-search-btn]');
  await submitBtn.evaluate((btn) => btn.click())
  await page.waitForNavigation()

  async function scrapeData(page) {
    const divs = await page.$$eval('div.card-body', (divs) => {
      const results = []
      //div objelerine atıyoruz sonuçları
      divs.forEach((div) => {
          const links = div.querySelectorAll('h5.card-title > a')
          links.forEach((link) => {
            results.push({
              text: link.textContent.trim(),
              href: link.getAttribute('href'),
            })
          })
      })
      return results
    })
   
    const titles = findTitles(divs)
    const urls = findUrls(divs)
    // const citations = findCitations(divs)
    // const pdfLinks = findPDFLinks(divs)
    // const authors = findAuthors(divs)
    // const dates =findDate(divs)
    //const url = 'http://aquatres.scientificwebjournals.com/tr/pub/issue/45444/578494';
    //scrapeDergipark(url);
    const urlss = [
      'https://dergipark.org.tr/tr/pub/ijmsit/issue/69913/1119738',
      'https://dergipark.org.tr/tr/pub/aquatres/issue/45444/578494',
 


      // Diğer URL'ler buraya eklenebilir...
    ];
    var i = 0
    urlss.forEach(async (url) => {
      try {
        if(i<10){
          await scrapeDergipark(url);
          i++
        }
        

      } catch (error) {
        console.error('Scraping işlemi başarısız oldu:', error);
      }
    });

    return { titles, urls}
  }

  // Kullanım
  const { titles, urls } = await scrapeData(page)

  // extractCitationNumber(citations)
  console.log(titles)
  console.log(urls)
  res.redirect('/')
}
// Fonksiyon 1: Başlık Bulma
function findTitles(divs) {
  const titles = []
  divs.forEach(({ text }) => {
    if (text) {
      titles.push(text)
    }
  })
  return titles
}
// Fonksiyon 2: URL Adresi Bulma
function findUrls(divs) {
  const urls = []
  divs.forEach(({ href }) => {
    if (href) {
      urls.push(href)
    }
  })
  return urls
}
function findCitations(divs) {
  const citations = []
  divs.forEach(({ divCitation }) => {
    if (divCitation) {
      citations.push(divCitation)
    }
  })
  return citations
}
function findPDFLinks(divs) {
  const pdfLinks = []
  divs.forEach(({ pdfLink }) => {
    if (pdfLink) {
      pdfLinks.push(pdfLink)
    }
  })
  return pdfLinks
}
function findAuthors(divs) {
  const authorsArray = [];
  divs.forEach(({ authors }) => {
    // Eğer authors özelliği tanımlı ise ve undefined değilse, authorsArray'e ekliyoruz
    if (authors !== undefined) {
      authorsArray.push(authors);
    }
  });
  return authorsArray;
}

function findDate(divs){
  const dateArray = [];
  divs.forEach(({dates}) =>{
    if (dates) {
    dateArray.push(dates);
  }
  });
  return dateArray;
  
}
function extractCitationNumber(citations) {
  for (let i = 0; i < citations.length; i++) {
    citations[i] = citations[i].replace(/[^0-9]/g, '')
  }
}
async function downloadPDF(url, destination) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(destination);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error('Error while downloading: ' + error.message);
  }
}


async function scrapeDergipark(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Sayfa içeriğini çekmek için uygun seçicileri kullanarak verileri alın
  const titles = await page.$$eval('.article-title', titles => titles.map(title => title.textContent.trim()).filter(title => title !== ''));
  const abstracts = await page.$$eval('.article-abstract p', abstracts => abstracts.map(abstract => abstract.textContent.trim()).filter(abstract => abstract !== ''));
  const keywords = await page.$$eval('.article-keywords p', keywords => {
    const keywordLists = keywords.map(keyword => keyword.textContent.trim());
    let combinedKeywords = '';
    keywordLists.forEach(keyword => {
        if (keyword !== '') {
            keyword = keyword.replace(/\s+/g, ' ');
            if (combinedKeywords !== '') {
                combinedKeywords += ', ';
            }
            combinedKeywords += keyword;
        }
    });
    return [combinedKeywords];
});

const author = await page.$$eval('.table.record_properties tbody tr td', tds => {
  let author = [];

  tds.forEach(td => {
      const paragraphs = td.querySelectorAll('p');
      paragraphs.forEach(paragraph => {
          const anchor = paragraph.querySelector('a');
          if (anchor) {
              author.push(anchor.textContent.trim());
              return; 
          }
      });
  });

  return [author];
});
const subtitleText = await page.$eval('.article-subtitle', span => span.textContent.trim().replace(/\s+/g, ' '));
const lastCommaIndex = subtitleText.lastIndexOf(',');
const lastIndex = lastCommaIndex !== -1 ? lastCommaIndex : subtitleText.length - 1;
const lastIndexSubstring = subtitleText.substring(lastIndex + 1).trim();

try {
  const doiNumber = await page.$eval('.article-doi a', anchor => anchor.href);
  console.log("Doi:",doiNumber );
} catch (error) {
  console.log('DOI yok');
}
const citationList = await page.$$eval('.article-citations ul li', lis => {
  return lis.map(li => li.textContent.trim());
});


// console.log('Başlıklar:', titles);
// console.log('Özetler:', abstracts);
// console.log("Keywords:",keywords);
// console.log("Yazarlar :",author);
// console.log('Yayımlanma Tarihi' ,lastIndexSubstring);
// console.log('Kaynakça',citationList);

const data = [];

for (let i = 0; i < titles.length; i++) {
    const dataObject = createDataObject(titles[i], abstracts[i], keywords[i],author[i], lastIndexSubstring, citationList);
    data.push(dataObject);
}

await browser.close();
}

function createDataObject(title, abstract, keyword, author, publicationDate, citation) {
  return {
      title: title,
      abstract: abstract,
      keyword: keyword,
      author: author,
      publicationDate: publicationDate,
      citation: citation
  };
}




