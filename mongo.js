const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('Give password as an argument')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://juhasarkkinen:${password}@cluster0.ivyar.mongodb.net/testBloglist?retryWrites=true&w=majority&appName=cluster0`
mongoose.set('strictQuery', false)
mongoose.connect(url)

// Määritellään mongon schema ja person malli
const blogSchema = mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number
})

const Blog = mongoose.model('Blog', blogSchema)

if (process.argv.length > 6) {
  const title = process.argv[3]
  const author = process.argv[4]
  const url = process.argv[5]
  const likes = process.argv[6]

  const blog = new Blog({
    title: title,
    author: author,
    url: url,
    likes: likes
  })

  blog.save().then(() => {
    console.log(`added ${title} by ${author} to bloglist`)
    mongoose.connection.close()
  })
} else {
  Blog.find({}).then(result => {
    console.log('Bloglist:')
    result.forEach(blog => {
      console.log(`${blog.title} by ${blog.author}, url:${blog.url}, likes: ${blog.likes}`)
    })
    mongoose.connection.close()
  })
}



