const Publication = require('../models/Publication')

exports.createPublication  = async (titles,cleanedAuthors,cleanedArticleKeywords,engineKeywords,citationList,publisher,prefixedPdfs,doi,cleanedAbstract,urls,publicationType,publicationDate) =>{
    for(let i=0; i< titles.length ;i++){
        try {
            const publication = await Publication.create({
              name : titles[i],
              authors:cleanedAuthors[i] ,
              publicationType: publicationType[i],
              publicationDate:publicationDate[i],
              publisherName:publisher[i],
              engineKeywords:engineKeywords[i],
              references :citationList[i],
              publicationKeywords:cleanedArticleKeywords[i],
              summary:cleanedAbstract[i],
              doiNumber:doi[i],
              urlAdress:urls[i]
            });
          } catch (error) {
            console.log(error)
          }
    }
  
}


exports.sortByDate = async (req,res )=> {
    const publications = await Publication.find({}).sort('publicationDate'); 
    res.render('index',{
     publications
    })
   }

   exports.sortByQuotation =async (req,res) => {
    const publications =await Publication.find({}).sort('quotationCount');
    res.render('index',{
        publications
    })
   }