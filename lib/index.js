const {fetchRepositories, fetchContributors} = require('./github')

function sumContributors (map, contributors) {
  contributors.forEach((contributor) => {
    const {id, contributions} = contributor
    const existingContributions = map.get(id) || 0
    map.set(id, existingContributions + contributions)
  })
  return map
}

function sortContributionsMap (map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function calculateTotalContributions (owner, limit = -1) {
  const fetchRepo = fetchContributors.bind(null, owner)

  return Promise.resolve()
    .then(() => fetchRepositories(owner))
    .then((repos) => Promise.all(repos.map(fetchRepo)))
    .then((results) => {
      const map = results.reduce(sumContributors, new Map())

      return sortContributionsMap(map)
        .slice(0, limit)
    })
}

module.exports = {
  calculateTotalContributions,
}
