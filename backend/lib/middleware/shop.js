const absoluteUrl = require('absolute-url')
const express = require('express')
const bodyParser = require('body-parser')
const ticket = require('./ticket')
const timeslot = require('./timeslot')

function shop ({ db }) {
  const router = new express.Router()

  router.use(absoluteUrl())

  router.get('/', async (req, res, next) => {
    if (req.accepts('html')) {
      return next()
    }

    const config = await db.getConfig()

    res.json({
      ...config,
      '@id': req.absoluteUrl(),
    })
  })

  router.put('/', bodyParser.json(), async (req, res, next) => {
    if (req.accepts('html')) {
      return next()
    }

    await db.setConfig(req.body)

    res.status(201).end()
  })

  router.use('/ticket', ticket({ db }))
  router.use('/timeslot', timeslot({ db }))

  return router
}

module.exports = shop
