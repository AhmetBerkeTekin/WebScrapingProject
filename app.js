const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const pageRoute = require('./routes/pageRoute')
const methodOverride = require('method-override')

const app = express()

mongoose.connect('mongodb://localhost:27017/webscrabing-db').then(()=>{
    console.log('DB connected successfully')
})

app.set('view engine', 'ejs')

//Middlewares
app.use('/public',express.static('public'))
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(methodOverride('_method', {
  methods:['POST', 'GET']
}));

app.use('/', pageRoute)

const port = 3000
app.listen(port, () => {
  console.log(`App started on port ${port}`)
})
