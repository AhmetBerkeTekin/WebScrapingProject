const Publication = require('../models/Publication')

exports.createPublication = async (
  titles,
  cleanedAuthors,
  cleanedArticleKeywords,
  engineKeywords,
  citationList,
  publisher,
  prefixedPdfs,
  doi,
  cleanedAbstract,
  urls,
  publicationType,
  publicationDate,
  quotationCount
) => {
  for (let i = 0; i < titles.length; i++) {
    try {
      const publication = await Publication.create({
        name: titles[i],
        authors: cleanedAuthors[i],
        publicationType: publicationType[i],
        publicationDate: publicationDate[i],
        publisherName: publisher[i],
        engineKeywords: engineKeywords[i],
        references: citationList[i],
        publicationKeywords: cleanedArticleKeywords[i],
        summary: cleanedAbstract[i],
        doiNumber: doi[i],
        urlAdress: urls[i],
        quotationCount: quotationCount[i],
        pdfLink :prefixedPdfs[i]
      })
    } catch (error) {
      console.log(error)
    }
  }
}

exports.sortByDate = async (req, res) => {
  const publications = await Publication.find({}).sort('publicationDate')
  res.render('index', {
    publications,
  })
}

exports.sortByQuotation = async (req, res) => {
  const publications = await Publication.find({}).sort('quotationCount')
  res.render('index', {
    publications,
  })
}

exports.getPublication = async (req,res) =>{
  const publication = await Publication.findOne({_id: req.params.id})
  res.render('publication',{
    publication
  })
}

exports.filterPublication = async (req, res) =>{
  const filterKeyword = req.query.keyword
  const filterName = req.query.name
  const filterAuthor = req.query.author
  const range = req.query.option1
  var [minString,maxString] = range.split(',')
  var min = parseInt(minString)
  var max = parseInt(maxString)

  let filter = {}
  if (filterName) {
    filter.name = { $regex: '.*' + filterName + '.*', $options: 'i' };
  }
  if (filterAuthor) {
    filter.authors = { $regex: '.*' + filterAuthor + '.*', $options: 'i' };
  }
  if (filterKeyword) {
    filter.publicationKeywords = { $regex: '.*' + filterKeyword + '.*', $options: 'i' };
  }
  if (min && max) {
    filter.quotationCount = { $gte: min, $lte: max };
  }
  if (!filterName && !filterKeyword && !filterAuthor) {
    filter = {
      name: { $regex: '.*' + '' + '.*', $options: 'i' },
      authors: { $regex: '.*' + '' + '.*', $options: 'i' },
      publicationKeywords: { $regex: '.*' + '' + '.*', $options: 'i' }
    };
  }
  
  const publications = await Publication.find({ $or: [filter] }).sort('quotationCount');
  //console.log(publications)
  res.status(200).render('index',{
    publications
  })
}