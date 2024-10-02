const { test, after, beforeEach } = require('node:test')
const Blog = require('../models/blog')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const assert = require('assert')
const blog = require('../models/blog')

const api = supertest(app)

// Tietokanta alustetaan näillä tiedoilla
const initialBlogs = [
    {
        title: "Omavaraisuushaaste",
        author: "Esa Juntunen",
        url: "https://www.blogit.fi/omavaraisuushaaste/",
        likes: 4
    },
    {
        title: "Puoli miljoonaa pääomaa",
        author: "Kirsikka",
        url: "https://puolimiljoonaapaaomaa.blogspot.com/",
        likes: 5,
    },
]

beforeEach(async() => {
    await Blog.deleteMany({})
    let blogObject = new Blog(initialBlogs[0])
    await blogObject.save()
    blogObject = new Blog(initialBlogs[1])
    await blogObject.save()
})

test('blogs are returned as json and the count is 2', async () => {
    // Testataan, että http vastaus on 200 ja content type on json
    const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    // Testataan, että palautettavien blogien määrä on 2
    assert.strictEqual(response.body.length, 2)
})

test('A blog has id field instead of _id', async () => {
    const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    response.body.forEach(element => {
        assert(element.id, 'Blog should have id')
        assert(!element._id, 'Blog shouldn\'t have _id')
    })
})

test('A blog can be added', async () => {
    const newBlog = {
        title: "This is a test title",
        author: "J. K. Rowling",
        url: "www.myfavoriteblog.fi",
        likes: 6
    }

    await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const titles = response.body.map(r => r.title)
    assert.strictEqual(response.body.length, initialBlogs.length + 1)
    assert(titles.includes('This is a test title'))
})

test('If likes not given in the request, the default value is 0', async() => {
    const newBlog = {
        title: "The test when likes is not given",
        author: "Tester",
        url: "www.likesshouldbezero.fi",
    }

    await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const blog = response.body.find( obj => obj.title === 'The test when likes is not given')
    assert.strictEqual(response.body.length, initialBlogs.length + 1) // Ensure that the blog can be added without likes defined
    assert(blog.hasOwnProperty('likes'), ' Blog should have a likes property') // Ensure that the API adds the property
    assert.strictEqual(blog.likes, 0, 'Likes default value is 0 when not provided') // Ensure that the default value is 0
})

test('The response is 400 if title or url is missing', async () => {
    const blogNoTitle = {
        author: "Test without title",
        url: "www.jepajee.fi"
    }

    const blogNoUrl = {
        title: "A test without url",
        author: "Tester",
    }

    await api
    .post('/api/blogs')
    .send(blogNoTitle)
    .expect(400)

    await api
    .post('/api/blogs')
    .send(blogNoUrl)
    .expect(400)
})

test('Delete blog', async() => {
    // Testaa poisto virheellisellä id:llä
    let response = await api
        .delete('/api/blogs/XXXXXXX')  // Virheellinen ID
        .expect(400)
        .expect('Content-Type', /application\/json/);

    // Tarkistetaan, että virheilmoitus on oikea
    assert.strictEqual(response.body.error, 'Malformatted id')

    // Testaa poisto olemassa olemattomalla kelvollisella id:llä
    const nonExistentId = new mongoose.Types.ObjectId();  // Luodaan kelvollinen, mutta olematon ID
    await api
        .delete(`/api/blogs/${nonExistentId}`)
        .expect(404);

    // Testaa poisto olemassa olevalla id:llä, haetaan eka entry
    response = await api.get('/api/blogs');
    const blogsAtStart = response.body;
    const idToDelete = blogsAtStart[0].id;

    await api
        .delete(`/api/blogs/${idToDelete}`)
        .expect(204);

    // Varmista, että blogi on poistettu
    response = await api.get('/api/blogs');
    const blogsAtEnd = response.body;
    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1, 'Amount of blogs should be reduced by 1');

    // Testataan, että poistettua blogia ei enää ole
    const deletedBlog = blogsAtEnd.find(blog => blog.id === idToDelete);
    assert.strictEqual(deletedBlog, undefined, 'Blog should no be found');
})

test('Change likes', async () => {
    // Testaa muutos virheellisellä id:llä
    let response = await api
        .put('/api/blogs/XXXXXXX')  // Virheellinen ID
        .expect(400)
        .expect('Content-Type', /application\/json/);

    // Tarkistetaan, että virheilmoitus on oikea
    assert.strictEqual(response.body.error, 'Malformatted id');

    // Testataan ei-olemassa olevalla ID:llä
    const nonExistentId = new mongoose.Types.ObjectId();
    response = await api
        .put(`/api/blogs/${nonExistentId}`)
        .expect(404)
        .send({ likes: 55 })

    // Tarkistetaan, että virheilmoitus on oikea
    assert.strictEqual(response.body.error, 'Blog not found');

    // Haetaan olemassa oleva ensimmäinen id
    // Testaa poisto olemassa olevalla id:llä, haetaan eka entry
    response = await api.get('/api/blogs');
    const blogsAtStart = response.body;
    const blogToChangeId = blogsAtStart[0].id;

    // Yritetään muutosta siten, että likes puuttuu
    response = await api
        .put(`/api/blogs/${blogToChangeId}`)
        .expect(400)
        .send({ })

    // Katsotaan myös virheilmoitus
    assert.strictEqual(response.body.error, 'Likes field is required');

    // Muutetaan likes arvo
    const likesNewValue = 500
    response = await api
        .put(`/api/blogs/${blogToChangeId}`)
        .expect(200)
        .send({ likes: likesNewValue})

    // Varmistetaan muutos
    response = await api.get('/api/blogs');
    const changedBlog = response.body.find(blog => blog.id === blogToChangeId)
    assert.strictEqual(changedBlog.likes, likesNewValue, `The likes value should be ${likesNewValue}`)
})

after(async () => {
    await mongoose.connection.close()
})