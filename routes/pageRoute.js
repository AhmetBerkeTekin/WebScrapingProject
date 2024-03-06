const express = require('express')
const pageController = require('../controllers/pageController')
const engineController = require('../controllers/engineController')
const publicationController = require('../controllers/publicationController')

const router = express.Router() 

router.route('/').get(pageController.getIndexPage)
router.route('/dateSort').get(publicationController.sortByDate)
router.route('/quotationSort').get(publicationController.sortByQuotation)
router.route('/search').post(engineController.scholarSearch)



module.exports = router