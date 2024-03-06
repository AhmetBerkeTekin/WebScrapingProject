const puppeteer = require('puppeteer')
const https = require('https')
const http = require('http')
const fs = require('fs')
const axios = require('axios')
const Typo = require('typo-js')
const publicationController = require('../controllers/publicationController')
var dictionary = new Typo('en_US')
const publicationController = require('../controllers/publicationController')
const downloadPath =
  'C:\\Kodlamalar\\JavaScriptCodes\\WebScrapingProject\\public\\PDFFiles\\'
 
exports.scholarSearch = async (req, res) => {
  process.setMaxListeners(20)
  console.log(req.body.keyword)
  var keyword = ''
  var isSpelledCorrectly = dictionary.check(req.body.keyword)
  if (!isSpelledCorrectly) {
    console.log('Burdayız')
    var array = dictionary.suggest(req.body.keyword)
    if (array.length != 0) {
      var originalWord = req.body.keyword
      var closestMatch
      var maxSimilarity = -1
      array.forEach(function (suggestedWord) {
        var similarity = 0
        for (var i = 0; i < originalWord.length; i++) {
          if (originalWord[i] === suggestedWord[i]) {
            similarity++
          }
        }
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity
          closestMatch = suggestedWord
        }
      })
      keyword = closestMatch
    } else {
      keyword = req.body.keyword
    }
  } else {
    keyword = req.body.keyword
  }

  console.log(keyword)

  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto('https://dergipark.org.tr/tr/')

  await page.setViewport({ width: 1080, height: 1024 })

  await page.type('input[name="q"]', keyword)

  const submitBtn = await page.$('button[id=home-search-btn]')
  await submitBtn.evaluate((btn) => btn.click())
  await page.waitForNavigation()

  const firstPage = async (page) => {
    const divs = await page.$$eval('div.card-body', (divs) => {
      const results = []
      //div objelerine atıyoruz sonuçları
      divs.forEach((div) => {
        const links = div.querySelectorAll('h5.card-title > a')
        links.forEach((link) => {
          results.push({
            href: link.getAttribute('href'),
          })
        })
      })
      return results
    })
    const urls = findUrls(divs)
    return urls
  }
  var urls = await firstPage(page)
  browser.close()

  const scrapeData = async () => {
    const browser = await puppeteer.launch({ headless: false })
    const results = []
    var i = 0
    for (const url of urls) {
      if (i == 10) break
      const page = await browser.newPage()
      await page.goto(url)
      const title = await page.$eval('.active .article-title', (element) => {
        return element.getAttribute('aria-label')
      })
      const authors = await page.$eval('.article-authors', (element) => {
        return element.textContent.trim()
      })
      const subTitle = await page.$eval('.article-subtitle', (element) => {
        return element.textContent.trim()
      })
      const splits = subTitle.split(',')
      const publicationDate = splits[splits.length - 1].trim()
      const absract = await page.$eval(
        '.active .article-abstract > p',
        (element) => {
          return element.textContent.trim()
        }
      )
      const engineKeywords = keyword
      const articleKeywords = await page.$eval(
        '.article-keywords',
        (element) => {
          return element.textContent.trim()
        }
      )
      const publicationType = await page.$eval(
        'table.record_properties tr:nth-child(3)',
        (row) => {
          const data = row.querySelector('td').textContent.trim()
          return data
        }
      )
      var doiNumber = ''
      try {
        doiNumber = await page.$eval('.doi-link', (element) => {
          return element.getAttribute('href')
        })
      } catch (error) {
        doiNumber = 'yok'
      }
      const publisher = 'DergiPark'
      const pdfLink = await page.$eval(
        'a.btn.btn-sm.float-left.article-tool.pdf.d-flex.align-items-center',
        (element) => {
          return element.getAttribute('href')
        }
      )
      results.push({
        title,
        authors,
        absract,
        engineKeywords,
        articleKeywords,
        doiNumber,
        publisher,
        pdfLink,
        publicationType,
        publicationDate
      })
      await page.close()
      i++
    }
    await browser.close()
    return results
  }
  const data = await scrapeData()
  const titles = data.map((item) => item.title)
  const authors = data.map((item) => item.authors)
  const articleKeywords = data.map((item) => item.articleKeywords)
  const engineKeywords = data.map((item) => item.engineKeywords)
  const publisher = data.map((item) => item.publisher)
  const abstract = data.map((item) => item.absract)
  const cleanedAbstract = abstract.map((abstract) => {
    return abstract.replace(/\s+/g, ' ').trim()
  })
  const pdfLink = data.map((item) => item.pdfLink)
  const prefixedPdfs = pdfLink.map((url) => `https://dergipark.org.tr${url}`)
  const cleanedArticleKeywords = articleKeywords.map((articleKeyword) => {
    return articleKeyword.replace(/\s+/g, ' ').trim()
  })
  const cleanedAuthors = authors.map((author) => {
    return author.replace(/\s+/g, ' ').trim()
  })
  const doi = data.map((item) => item.doiNumber)
  const publicationType = data.map((item) => item.publicationType)
  const publicationDate = data.map((item) => item.publicationDate)
  let dateTarihler = [];

  publicationDate.forEach((stringTarih) => {
    const parts = stringTarih.split("."); // Stringi parçalayarak diziye dönüştürüyoruz
    const formattedDateString = parts[2] + "-" + parts[1] + "-" + parts[0]; // Yıl, ay ve günü sırasıyla alarak ISO formatına dönüştürüyoruz
    const dateObject = new Date(formattedDateString);
    dateTarihler.push(dateObject);
});

  // console.log(titles)
  // console.log(cleanedAuthors)
  // console.log(cleanedArticleKeywords)
  // console.log(engineKeywords)
  // console.log(publisher)
  // console.log(prefixedPdfs)
  // console.log(doi)
  // console.log(cleanedAbstract)
  // console.log(urls)
  // console.log(publicationType)
  // console.log(publicationDate)
   await publicationController.createPublication(titles,cleanedAuthors,cleanedArticleKeywords,engineKeywords,publisher,prefixedPdfs,doi,cleanedAbstract,urls,publicationType,dateTarihler)
  res.redirect('/')
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
async function downloadPDF(url, destination) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    })

    const writer = fs.createWriteStream(destination)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  } catch (error) {
    throw new Error('Error while downloading: ' + error.message)
  }
}
 

