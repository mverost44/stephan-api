const express = require('express')

const router = express.Router()

const keygen = require('keygenerator')

const SquareConnect = require('square-connect')

const defaultClient = SquareConnect.ApiClient.instance

require('dotenv').config()

// Configure OAuth2 access token for authorization: oauth2
const oauth2 = defaultClient.authentications['oauth2']
oauth2.accessToken = process.env.SQUARE_TOKEN

const apiInstance = new SquareConnect.CustomersApi()
const transactionInstance = new SquareConnect.TransactionsApi()

const transactionPromise = function (data, customerId) {
  const locationId = process.env.LOCATION
  const body = {
    idempotency_key: keygen.transaction_id(),
    customer_id: customerId,
    customer_card_id: data.card.id,
    amount_money: {
      currency: 'USD',
      amount: 1900
    }
  }
  return transactionInstance.charge(locationId, body)
    .catch(err => console.log(err))
}

router.post('/customer', (req, res, next) => {
  const body = {
    given_name: req.body.customer.name,
    email_address: req.body.customer.email
  } // CreateCustomerRequest | An object containing the fields to POST for the request.  See the corresponding object definition for field details.
  apiInstance.createCustomer(body)
    .then(data => {
      res.status(201).json({ data })
    })
    .catch(next)
})

router.post('/customer-card', (req, res, next) => {
  const body = {card_nonce: req.body.card_nonce}
  const customerId = req.body.customerId

  apiInstance.createCustomerCard(customerId, body)
    .then(data => {
      return transactionPromise(data, customerId)
    })
    .then(data => {
      return res.status(201).json({ data })
    })
    .catch(next)
})

module.exports = router
