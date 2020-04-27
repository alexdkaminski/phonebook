const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

app.use(cors())

app.use(express.static('build'))

morgan.token('body', function (req, res) { return JSON.stringify(req.body) })

app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req,res), 'ms',
    tokens.body(req,res)
  ].join(' ')
}))

app.use(express.json())

let persons =
  [
    {
      "name": "Michael Rooney",
      "number": "12345678",
      "id": 1
    },
    {
      "name": "Alex Kaminski",
      "number": "56781234",
      "id": 2
    },
    {
      "name": "Katie Dangerfield",
      "number": "98761234",
      "id": 3
    }
  ]

app.get('/api/persons', (req,res) => {
  res.json(persons)
})

app.get('/api/info', (req,res) => {
  const personsCount = persons.length
  const timeStamp = new Date()
  const content = `
  <p>Phonebook has info for ${personsCount} persons</p>
  <p>${timeStamp}</p>
  `;
  res.send(content)
})

app.get('/api/persons/:id', (req,res) => {
  const id = Number(req.params.id)
  console.log(id);

  const person = persons.find(person => person.id === id)
  console.log(person)
  if (person) {
    res.json(person)
  } else {
    res.status(404).end()
  }
})

app.delete('/api/persons/:id', (req,res) => {
  const id = Number(req.params.id)
  persons = persons.filter(person => person.id !== id)

  res.status(204).end()
})

app.post('/api/persons', (req,res) => {
  const body = req.body
  const createId = () => {
      return (Math.floor(Math.random()*10000))
  }

  let nameExists = persons.find(person => person.name === body.name)

  if(!body.name) {
    return res.status(400).json({
      error: 'name missing'
    })
  } else if (!body.number) {
    return res.status(400).json({
      error: 'number missing'
    })
  } else if (nameExists) {
    return res.status(400).json({
      error: 'name must be unique'
    })
  }

  const person = {
    name: body.name,
    number: body.number,
    id: createId()
  }

  persons = persons.concat(person)

  res.json(person)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})