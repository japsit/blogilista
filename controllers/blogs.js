const blogsRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user',
    { username: 1, name: 1, id: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body

  const token = request.token

  // Nämä voisi kyllä korvatat ekemällä tokenValidator, ja käyttämällä post-kutsun parametrina
  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  if (!body.title) {
    return response.status(400).json({ error: 'Title is missing' })
  }

  if (!body.url) {
    return response.status(400).json({ error: 'Url is missing' })
  }

  const user = request.user
  const blog = new Blog({
    likes: 0,
    ...body,
    user: user._id
  })
  const result = await blog.save()
  user.blogs = user.blogs.concat(result._id)
  await user.save()
  response.status(201).json(result)
})

blogsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: 'Malformatted id' })
  }

  const token = request.token
  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const user = request.user
  if (!user.blogs.includes(id))
  {
    return response.status(403).json({ error: 'Delete forbidden for user' })
  }

  const deletedBlog = await Blog.findByIdAndDelete(id)
  if (deletedBlog) {
    // Poistetaan myös käyttäjältä viittaus tähän blogin omistajuuteen
    user.blogs = user.blogs.filter(blogId => blogId.toString() !== id)
    await user.save()
    response.status(204).end()
  } else {
    response.status(404).json({ error: 'Blog not found' })
  }
})

// Muutos blogin likes
blogsRouter.put('/:id', async (request, response) => {
  const { id } = request.params
  const { likes } = request.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: 'Malformatted id' })
  }

  if (likes === undefined) {
    return response.status(400).json({ error: 'Likes field is required' })
  }

  const updatedBlog = await Blog.findByIdAndUpdate(id, { likes }, { new: true })
  if (updatedBlog) {
    response.status(200).json(updatedBlog)
  } else {
    response.status(404).json({ error: 'Blog not found' })
  }
})


module.exports = blogsRouter