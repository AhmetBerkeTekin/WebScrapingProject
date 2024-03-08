const puppeteer = require('puppeteer')
const https = require('https')
const http = require('http')
const fs = require('fs')
const axios = require('axios')
const Typo = require('typo-js')
const publicationController = require('../controllers/publicationController')
var dictionary = new Typo('en_US')
const downloadPath =
  'C:\\Kodlamalar\\JavaScriptCodes\\WebScrapingProject\\public\\PDFFiles\\'

exports.scholarSearch = async (req, res) => {
  process.setMaxListeners(20)
  console.log(req.body.keyword)
  var keyword = ''
  var isSpelledCorrectly = dictionary.check(req.body.keyword)
  if (!isSpelledCorrectly) {
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
      try {
        await page.goto(url)
        var title,
          authors,
          subTitle,
          publicationDate,
          abstract,
          engineKeywords,
          articleKeywords,
          citationList,
          publicationType,
          pdfLink
        try {
          title = await page.$eval('.active .article-title', (element) => {
            return element.textContent.trim()
          })
        } catch (error) {
          console.error('Başlık alinamadi:', error)
          title = 'Gelmeyen veri'
        }
        try {
          authors = await page.$eval('.article-authors', (element) => {
            return element.textContent.trim()
          })
        } catch (error) {
          console.error('Yazarlar alinamadi:', error)
          authors = 'Gelmeyen veri'
        }
        try {
          subTitle = await page.$eval('.article-subtitle', (element) => {
            return element.textContent.trim()
          })
          const splits = subTitle.split(',')
          publicationDate = splits[splits.length - 1].trim()
        } catch (error) {
          console.error('Tarih alinamadi:', error)
          publicationDate = ''
        }
        try {
          abstract = await page.$eval(
            '.active .article-abstract > p',
            (element) => {
              return element.textContent.trim()
            }
          )
        } catch (error) {
          console.error('Ozet alinamadi:', error)
          abstract = 'Gelmeyen veri'
        }
        engineKeywords = keyword
        try {
          articleKeywords = await page.$eval('.article-keywords >p', (element) => {
            return element.textContent.trim()
          })
        } catch (error) {
          console.error('Makale anahtar kelimeleri alinamadi', error)
          articleKeywords = 'Gelmeyen veri'
        }
        try {
          citationList = await page.$eval('.article-citations', (lis) => {
            return lis.textContent.trim()
          })
        } catch (error) {
          console.error('Referanslar alinamadi', error)
          citationList = 'Gelmeyen veri'
        }
        try {
          publicationType = await page.$eval(
           'span.kt-font-bold',(element) => {
            return element.textContent.trim()
           }
          )
        } catch (error) {
          console.error('Makale turu alinamadi', error)
          publicationType = 'Gelmeyen veri'
        }
        var doiNumber = ''
        try {
          doiNumber = await page.$eval('.doi-link', (element) => {
            return element.getAttribute('href')
          })
        } catch (error) {
          doiNumber = 'yok'
        }
        const publisher = 'DergiPark'
        try {
          pdfLink = await page.$eval(
            'a.btn.btn-sm.float-left.article-tool.pdf.d-flex.align-items-center',
            (element) => {
              return element.getAttribute('href')
            }
          )
        } catch (error) {
          console.error('PDF linki alinamadi', error)
          pdfLink = 'Gelmeyen veri'
        }
        const quotationCount = Math.floor(Math.random() * 1000) + 1
        results.push({
          title,
          authors,
          abstract,
          engineKeywords,
          articleKeywords,
          citationList,
          doiNumber,
          publisher,
          pdfLink,
          publicationType,
          publicationDate,
          quotationCount,
        })
        await page.close()
        i++
      } catch (error) {
        console.log(error)
      }
    }
    await browser.close()
    return results
  }
  const data = await scrapeData()
  const titles = data.map((item) => item.title)
  const authors = data.map((item) => item.authors)
  const articleKeywords = data.map((item) => item.articleKeywords)
  const engineKeywords = data.map((item) => item.engineKeywords)
  const citationList = data.map((item) => item.citationList)
  const cleanedCitationList = citationList.map((citation) => {
    return citation.replace(/\s+/g, ' ').trim()
  })
  const publisher = data.map((item) => item.publisher)
  const quotationCount = data.map((item) => item.quotationCount)
  const abstract = data.map((item) => item.abstract)
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
  let dateTarihler = []

  publicationDate.forEach((stringTarih) => {
    const parts = stringTarih.split('.') // Stringi parçalayarak diziye dönüştürüyoruz
    const formattedDateString = parts[2] + '-' + parts[1] + '-' + parts[0] // Yıl, ay ve günü sırasıyla alarak ISO formatına dönüştürüyoruz
    const dateObject = new Date(formattedDateString)
    dateTarihler.push(dateObject)
  })

  await publicationController.createPublication(
    titles,
    cleanedAuthors,
    cleanedArticleKeywords,
    engineKeywords,
    cleanedCitationList,
    publisher,
    prefixedPdfs,
    doi,
    cleanedAbstract,
    urls,
    publicationType,
    dateTarihler,
    quotationCount  
  )
 // downloadFiles(prefixedPdfs, 10); 
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
async function downloadFiles(url, count) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  for (let i = 0; i < count; i++) {
    const pageUrl = await url[i]
    try {
      await page.goto(pageUrl)
      await page.waitForTimeout(4000)

    } catch (e) {
      console.log(`Error loading ${pageUrl}`)
    }
  }
  await browser.close()
}
