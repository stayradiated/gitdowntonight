const fetch = require('isomorphic-fetch')

const GH_ACCESS_TOKEN = process.env.GH_ACCESS_TOKEN

function request (method, path, body) {
  return fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `bearer ${GH_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })
  .then((res) => res.json())
}

function graphql (body) {
  return request('POST', '/graphql', body)
}


module.exports = {
  request,
  graphql,
}
