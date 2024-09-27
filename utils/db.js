const mongoose = require('mongoose')
const { MONGODB_URI } = require('./config')
const logger = require('./logger')

const connect = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    logger.info('Connected to MongoDB')
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message)
    process.exit(1)
  }
}

module.exports = { connect }
