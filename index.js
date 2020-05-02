const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
require('dotenv').config()
const Person = require('./models/person')

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

app.get('/api/info', (req,res) => {
  Person.countDocuments({})
    .then(count => {
      const timeStamp = new Date()
      const content = `
      <p>Phonebook has info for ${count} persons</p>
      <p>${timeStamp}</p>
      `;
      res.send(content)
    })
})

app.get('/api/persons', (req,res) => {
  Person.find({})
    .then(persons => {
      res.json(persons.map(person => person.toJSON()))
    })
})

app.get('/api/persons/:id', (req,res) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person.toJSON())
      } else {
        res.status(404).end()
      }
    })

})

app.delete('/api/persons/:id', (req,res,next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(result => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (req,res,next) => {
  const body = req.body

  if(!body.name) {
    return res.status(400).json({
      error: 'name missing'
    })
  } else if (!body.number) {
    return res.status(400).json({
      error: 'number missing'
     })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person
    .save()
    .then(savedPerson => savedPerson.toJSON())
    .then(savedAndFormattedNote => res.json(savedAndFormattedNote))
    .catch(err => next(err))

  // Person.countDocuments({name: body.name})
  //   .then(count => {
  //     console.log(`count: ${count}`)
  //     if (count > 0) {
  //       console.log('person exists')
  //     } else {
  //       console.log('person does not exist')
  //       const person = new Person({
  //         name: body.name,
  //         number: body.number
  //       })
  //       person.save().then(savedPerson => {
  //         res.json(savedPerson.toJSON())
  //       })
  //     }
  //   })
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(req.params.id, person, { new: true })
    .then(updatedPerson=> {
      res.json(updatedPerson.toJSON())
    })
    .catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  console.error(error.message)
  console.log('An error has occured')

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).send({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})