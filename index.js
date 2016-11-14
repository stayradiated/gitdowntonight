const fetch = require('isomorphic-fetch')

const GH_ACCESS_TOKEN = process.env.GH_ACCESS_TOKEN

function request () {
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${GH_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: 'query { viewer { login }}',
    }),
  })
  .then((res) => res.json())
}

request().then((res) => {
  console.log(JSON.stringify(res, null, 2))
}).catch((error) => {
  console.log(error)
})
