const puppeteer = require('puppeteer')

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

  const titles = []
  const urlAdresses = []
  const quatotions = []

  const divs = await page.$$eval('.gs_r.gs_or.gs_scl', (divs) => {
    const results = []

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
        const citations = div.querySelectorAll('.gs_fl.gs_flb > a')
        citations.forEach((citation)=>{
          if(citation.textContent.includes('Alıntılanma sayısı')){
            if (citation.textContent.trim()) {
              results.push({
                divCitation: citation.textContent.trim()
              })
            }
          }
        })
      }
    })

    return results
  })

  divs.forEach(({ text }) => titles.push(text))
  divs.forEach(({ href }) => urlAdresses.push(href))
  divs.forEach(({ divCitation }) => quatotions.push(divCitation))
  const filteredTitles = titles.filter(function (element) {
    return element !== undefined;
    });
  const filteredUrlAdresses = urlAdresses.filter(function (element) {
    return element !== undefined;
    });
  const filteredCitations = quatotions.filter(function (element) {
    return element !== undefined;
    });
  console.log(filteredTitles)
  console.log(filteredUrlAdresses)
  console.log(filteredCitations)
 
  res.redirect('/')
}
