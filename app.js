const database  = require('./utils/db')
const express = require('express')
const app = express()
const blogsRouter = require('./controllers/blogs')
const middleware = require('./utils/middleware')
const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use('/api/blogs', blogsRouter)

database.connect()

module.exports = app