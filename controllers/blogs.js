const blogsRouter = require('express').Router()
const { default: mongoose } = require('mongoose')
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
  })
  
blogsRouter.post('/', async (request, response) => {
    if (!request.body.title) {
      return response.status(400).json({ error: 'Title is missing'})
    } 
    
    if (!request.body.url) {
      return response.status(400).json({ error: 'Url is missing'})
    }

    const blog = new Blog({
      likes: 0,
      ...request.body
    })
    const result = await blog.save()
    response.status(201).json(result)
  })

  blogsRouter.delete('/:id', async (request, response) => {
    const { id } = request.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({ error: 'Malformatted id'})
    }

    const deletedBlog = await Blog.findByIdAndDelete(id)
    if (deletedBlog) {
      response.status(204).end()
    } else {
      response.status(404).json({ error: 'Blog not found'})
    }
  })

  // Muutos blogin likes
  blogsRouter.put('/:id', async (request, response) => {
    const {id} = request.params
    const { likes } = request.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({ error: 'Malformatted id'})
    }

    if (likes === undefined) {
      return response.status(400).json({ error: 'Likes field is required'})
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, { likes }, { new: true })
    if (updatedBlog) {
      response.status(200).json(updatedBlog);
  } else {
      response.status(404).json({ error: 'Blog not found' });
  }
  })


module.exports = blogsRouter