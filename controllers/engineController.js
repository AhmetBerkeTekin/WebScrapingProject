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
      }
    })

    return results
  })

  divs.forEach(({ text }) => titles.push(text))
  divs.forEach(({ href }) => urlAdresses.push(href))
  console.log(titles)
  console.log('\n\n\n')
  console.log(urlAdresses)

  res.redirect('/')
}
