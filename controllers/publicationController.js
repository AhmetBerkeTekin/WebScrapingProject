const Publication = require('../models/Publication')

exports.createPublication  = async (titles,cleanedAuthors,cleanedArticleKeywords,engineKeywords,publisher,prefixedPdfs,doi,cleanedAbstract,urls,publicationType,publicationDate) =>{
    for(let i=0; i< titles.length ;i++){
        try {
            const publication = await Publication.create({
              name : titles[i],
              authors:cleanedAuthors[i] ,
              publicationType: publicationType[i],
              publicationDate:publicationDate[i],
              publisherName:publisher[i],
              engineKeywords:engineKeywords[i],
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
