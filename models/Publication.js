const mongoose = require('mongoose')
var moment = require('moment');
moment().format(); 
const Schema = mongoose.Schema

const PublicationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  authors: {
    type: [String],
    default: [],
  },
  publicationType: {
   type: String,
   default: []
  },
  publicationDate:{
    type: Date,
    default: moment()
  },
  publisherName: {
    type: String,
    default: ""
   },
  engineKeywords: [String],
  publicationKeywords:  {
    type:[String],
    default:[]
  },
  summary:{
    type: String,
    default: ""
   },
  references: {
    type: String,
    default: []
   },
  quotationCount: {
    type: Number,
    default: 0,
  },
  doiNumber: {
    type: Number,
    required: false,
  },
  urlAdress: String,
})

const Publication = mongoose.model('Publication', PublicationSchema)
module.exports = Publication
