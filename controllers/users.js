const bcrypt = require('bcryptjs')
const userRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const User = require('../models/user')

userRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', { user: 0 })
  response.json(users)
})

userRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  if (!username || !password) {
    return response.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 3) {
    return response.status(400).json({ error: 'Password must be at least 3 characters long' });
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash
  })

  try {
    const savedUser = await user.save()
    response.status(201).json(savedUser)
  } catch (error) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return response.status(400).json({ error: 'Username must be unique' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message });
    } else if (error.name ===  'JsonWebTokenError') {
      return response.status(400).json({ error: 'token missing or invalid' })
    }
    response.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = userRouter