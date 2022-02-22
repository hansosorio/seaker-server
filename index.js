const axios = require('axios');
const bodyParser = require('body-parser')
const express = require('express')

const app = express()
const port = 3001

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/api/items', async (req, res) => {

  const q = req.query.q
  const { firstName, lastName } = req.body?.author

  const results = await axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${q}`)
  const fetchProducts = results.data

  const products = fetchProducts.results.slice(0, 4).map(el => {
  	return {
      'id': el.id,
    	'title': el.title,
    	'price': {
    		'currency': el.prices.prices[0].currency_id,
    		'amount': el.prices.prices[0].amount,
    		'decimals': el.price
    	},
    	'picture': el.thumbnail,
    	'condition': el.condition,
    	'free_shipping': el.shipping.free_shipping,
      'location': el.address.state_name,
    }
  })

  const allCategories = fetchProducts.available_filters.filter(el => el.id === 'category')
  const categories = allCategories[0].values.sort((a, b) => b.results - a.results).slice(0, 5).map( el => el.name )

  res.status(200).send({ author: { firstName, lastName }, categories, items: products });
});

app.post('/api/items/:id', async (req, res) => {
  let id = req.params.id
  const { firstName, lastName } = req.body?.author

  const results = await axios.get(`https://api.mercadolibre.com/items/${id}`)
  const fetchProduct = results.data

  const resultsDescription = await axios.get(`https://api.mercadolibre.com/items/${id}/description`)
  const fetchDescription = resultsDescription.data

  const product = {
    'id': fetchProduct.id,
    'title': fetchProduct.title,
    'price': {
      'currency': fetchProduct.price,
      'amount': fetchProduct.price,
      'decimals': fetchProduct.price
    },
    'picture': fetchProduct.pictures[0].secure_url,
    'condition': fetchProduct.attributes.filter(el => el.id === 'ITEM_CONDITION')[0].value_name,
    'free_shipping': fetchProduct.shipping.free_shipping,
    'sold_quantity': fetchProduct.sold_quantity,

    'description': fetchDescription.plain_text
  }

  res.status(200).send({ author: { firstName, lastName }, item: product });
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
