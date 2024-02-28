const express = require('express')
const pageController = require('../controllers/pageController')
const engineController = require('../controllers/engineController')

const router = express.Router()

router.route('/').get(pageController.getIndexPage)
router.route('/search').post(engineController.scholarSearch)

module.exports = router