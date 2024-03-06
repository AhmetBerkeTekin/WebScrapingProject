const Publication = require('../models/Publication')

exports.createPublication  = async (titles) =>{
    const publication =await Publication.create(); 
    try{
        console.log(titles)
  
    }
    catch{
        
    }
  
}
