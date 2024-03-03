const Publication =require('../models/Publication')

exports.createPublication  = async () =>{
    const publication =await Publication.create(); 
    try{
          res.status(201).json({
        status:'success',
        publication
    })
    }
    catch{
        res.status(400).json({
            status:'fail',
            error
        })
    }
  
}