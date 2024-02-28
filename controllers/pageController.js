const Publication = require('../models/Publication')

exports.getIndexPage = async (req, res) => {
  try {
  const publications = await Publication.find()
    res.status(200).render('index',{
      publications,
    })
  } catch(error) {
    res.status(400).json({
      status: 'fail',
      error,
    })
  }
}

