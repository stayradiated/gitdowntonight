const fetch = require('isomorphic-fetch')
const inquirer = require('inquirer')
const chalk = require('chalk')
const flags = require('flags')

flags.defineInteger('poll', 0, 'Polling mode')
flags.defineInteger('limit', 15, 'Limit results')
flags.parse()

const POLL = flags.get('poll')
const LIMIT = flags.get('limit')
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

function getRepositories (owner) {
  return graphql({
    variables: {owner},
    query: `query getRepositories($owner: String!) {
      repositoryOwner(login: $owner) {
        repositories(first: 30) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    }`,
  }).then((result) => {
    return result.data.repositoryOwner.repositories.edges.map((edge) => {
      return edge.node.name
    })
  })
}

function getContributors (owner, repo) {
  return request('GET', `/repos/${owner}/${repo}/contributors`)
    .then((contributors) => {
      return contributors.map((contributor) => {
        return {
          id: contributor.login,
          contributions: contributor.contributions,
        }
      })
    })
}

function getTotalContributions (owner) {
  return getRepositories(owner).then((repos) => {
    return Promise.all(repos.map((repo) => getContributors(owner, repo)))
  }).then((results) => {
    return results.reduce((tally, repoContributors) => {
      repoContributors.forEach((contributor) => {
        const {id, contributions} = contributor
        tally.set(id, (tally.get(id) || 0) + contributions)
        return tally
      })
      return tally
    }, new Map())
  }).then((tally) => {
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, LIMIT)
  })
}

function promptOwnerName () {
  return inquirer.prompt([{
    name: 'owner',
    message: '>>> Please enter an organisation name\n',
    default: 'mishguruorg',
  }]).then((result) => result.owner)
}

function displayContributions (repoOwner) {
  console.log(chalk.grey('>>> Processing repositories...'))
  return getTotalContributions(repoOwner)
  .then((result) => {
    result.forEach(([owner, contributions], i) => {
      console.log(
        chalk.grey(`>>> ${i + 1}.`),
        chalk.yellow(owner) + chalk.grey(':'),
        chalk.blue(contributions),
        chalk.grey('contributions')
      )
    })
  }).catch((error) => {
    console.error('!!!', error)
  })
}

function pollContributions (owner, timeout) {
  displayContributions(owner).then(() => {
    console.log(chalk.grey(`>>> Waiting ${timeout / 1000} seconds...`))
    setTimeout(pollContributions.bind(null, owner, timeout), timeout)
  })
}

promptOwnerName().then((owner) => {
  if (POLL > 0) {
    pollContributions(owner, POLL * 1000)
  } else {
    displayContributions(owner)
  }
})
