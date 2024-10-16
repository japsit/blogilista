
const _ = require('lodash')


const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => ( blogs.reduce((summa, blog) => summa + blog.likes, 0) )

const favoriteBlog = (blogs) => (blogs.reduce((favorite, blog) => (favorite.likes > blog.likes) ? favorite : blog))

const mostBlogs = (blogs) => {
  const authorCount = _.countBy(blogs, 'author')
  // Muutetaan arrayksi, jotta helpompi käsitellä
  const authors = Object.entries(authorCount)
  // Etsitään suurin määrä julkaisuja
  const mostPublishedAuthor = _.maxBy(authors, item => item[1])
  // Palautetaan jälleen objektina
  return {
    author: mostPublishedAuthor[0],
    blogs: mostPublishedAuthor[1]
  }
}

const mostLikes = (blogs) => {
  // Lasketaan eri kirjoittajien tykkäykset yhteen
  const calcLikes = (table, blog) => {
    table[blog.author] = (table[blog.author] || 0) + blog.likes
    return table
  }
  const authorLikes = blogs.reduce(calcLikes, {})
  const mostLikesAuthor = _.maxBy(Object.entries(authorLikes), item => item[1])
  return {
    author: mostLikesAuthor[0],
    likes: mostLikesAuthor[1]
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}