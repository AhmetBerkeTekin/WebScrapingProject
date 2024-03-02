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

  await page.goto('https://scholar.google.com')

  await page.setViewport({ width: 1080, height: 1024 })

  await page.type('input[name="q"]', keyword)

  const submitBtn = await page.$('button[type=submit]')
  await submitBtn.evaluate((btn) => btn.click())
  await page.waitForNavigation()

  async function scrapeData(page) {
    const divs = await page.$$eval('.gs_r.gs_or.gs_scl', (divs) => {
      const results = []
      //div objelerine atıyoruz sonuçları
      divs.forEach((div) => {
        const hasPdfText = div.textContent.includes('PDF')
        if (hasPdfText) {
          const links = div.querySelectorAll('.gs_ri > h3 > a')
          links.forEach((link) => {
            results.push({
              text: link.textContent.trim(),
              href: link.getAttribute('href'),
            })
          })
          //başka div objeleri
          const citations = div.querySelectorAll('.gs_fl.gs_flb > a')
          citations.forEach((citation) => {
            if (citation.textContent.includes('Alıntılanma sayısı')) {
              if (citation.textContent.trim()) {
                results.push({
                  divCitation: citation.textContent.trim(),
                })
              }
            }
          })
          const pdfLinks = div.querySelectorAll('.gs_or_ggsm > a')
          pdfLinks.forEach((link) => {
            results.push({
              pdfLink: link.getAttribute('href'),
            })
          })
          const authors = div.querySelectorAll('div.gs_a')
          authors.forEach((authorElement)=>{
            const authorText = authorElement.textContent.trim();
            const authorsPart = authorText.split('-')[0].trim();
            //const individualAuthors = authorsPart.split(',');
            results.push({
              authors: authorsPart
            })
          })
          const dates = div.querySelectorAll('div.gs_a')
          dates.forEach((dateElement)=>{
            const dateText = dateElement.textContent.trim();
            const yearMatch = dateText.match(/\d{4}/); // Dört haneli sayısal deseni bul
            if (yearMatch) {
                const year = parseInt(yearMatch[0]);
                results.push({ dates: year });
            }
          })
        }
      })
      return results
    })
    const titles = findTitles(divs)
    const urls = findUrls(divs)
    const citations = findCitations(divs)
    const pdfLinks = findPDFLinks(divs)
    const authors = findAuthors(divs)
    const dates =findDate(divs)

    return { titles, urls, citations, pdfLinks, authors,dates}
  }

  // Kullanım
  const { titles, urls, citations, pdfLinks, authors,dates } = await scrapeData(page)
  extractCitationNumber(citations)
  console.log(titles)
  console.log(urls)
  console.log(citations)
  console.log(pdfLinks)
  console.log(authors)
  console.log(dates)

  const promises = pdfLinks.map((url, i) => {
    return downloadPDF(url, `${downloadPath}example${i}.pdf`)
      .then(() => ({ status: 'fulfilled' }))
      .catch((error) => ({ status: 'rejected', reason: error }))
  })
  const allPromise = Promise.all(promises)
  try {
    const values = await allPromise
    console.log(values)
  } catch (error) {
    console.log(error)
  }
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
