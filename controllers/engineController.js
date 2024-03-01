const puppeteer = require('puppeteer')
const https = require('https')
const http = require('http')
const fs = require('fs')
const downloadPath =
  'C:\\Kodlamalar\\JavaScriptCodes\\WebScrapingProject\\public\\PDFFiles\\'

exports.scholarSearch = async (req, res) => {
  console.log(req.body.keyword)
  const keyword = req.body.keyword
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
        }
      })
      return results
    })

    const titles = findTitles(divs)
    const urls = findUrls(divs)
    const citations = findCitations(divs)
    const pdfLinks = findPDFLinks(divs)

    return { titles, urls, citations, pdfLinks }
  }

  // Kullanım
  const { titles, urls, citations, pdfLinks } = await scrapeData(page)
  extractCitationNumber(citations)
  console.log(titles)
  console.log(urls)
  console.log(citations)
  console.log(pdfLinks)

  const promises = pdfLinks.map((url, i) => {
    return downloadPDF(url, `example${i}.pdf`)
      .then(() => ({ status: 'fulfilled' }))
      .catch((error) => ({ status: 'rejected', reason: error }))
  })
  Promise.allSettled(promises).then((results) => {
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`example${i}.pdf dosyası başarıyla indirildi.`)
      } else {
        console.error(
          `example${i}.pdf dosyası indirilemedi. Hata: ${result.reason}`
        )
      }
    })
  })
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
function extractCitationNumber(citations) {
  for (let i = 0; i < citations.length; i++) {
    citations[i] = citations[i].replace(/[^0-9]/g, '')
  }
}
function downloadPDF(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination)
    if (url.includes('https://')) {
      https
        .get(url, (response) => {
          response.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve()
          })
        })
        .on('error', (err) => {
          fs.unlink(destination, () => {
            reject(err.message)
          })
        })
    } else if (url.includes('http://')) {
      http
        .get(url, (response) => {
          response.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve()
          })
        })
        .on('error', (err) => {
          fs.unlink(destination, () => {
            reject(err.message)
          })
        })
    }
  })
}
