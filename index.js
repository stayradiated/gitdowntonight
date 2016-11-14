const fs = require('fs')
const promisify = require('es6-promisify')
const fetch = require('isomorphic-fetch')
const inquirer = require('inquirer')
const chalk = require('chalk')
const flags = require('flags')
const lockfile = require('lockfile')

const writeFile = promisify(fs.writeFile, fs)
const readFile = promisify(fs.readFile, fs)
const lock = promisify(lockfile.lock, lockfile)
const unlock = promisify(lockfile.unlock, lockfile)

flags.defineInteger('poll', 0, 'Polling mode')
flags.defineInteger('limit', 15, 'Limit results')
flags.defineString('owner', '', 'Owner')
flags.defineString('out', '', 'Write ranking to text file')
flags.parse()

const POLL = flags.get('poll')
const LIMIT = flags.get('limit')
const OWNER = flags.get('owner')
const OUT = flags.get('out')
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
    if (result.message != null) {
      throw new Error(result.message)
    }

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
  if (OWNER.length > 0) {
    return Promise.resolve(OWNER)
  }

  return inquirer.prompt([{
    name: 'owner',
    message: '>>> Please enter an organisation name\n',
    default: 'mishguruorg',
  }]).then((result) => result.owner)
}

function handleError (error) {
  const message = error.message != null ? error.message : error
  console.error(chalk.red(`>>> ${message}`))
}

function saveContributions (results, fp) {
  const lockFp = `${fp}.lock`
  lock(lockFp)
    .then(() => readFile(fp, 'utf8').then((oldData) => {
      const data = JSON.stringify(results)
      if (data !== oldData) {
        console.log(chalk.green(`>>> Saving to ${fp}`))
        return writeFile(fp, JSON.stringify(results))
      }
    }))
    .catch(handleError)
    .then(() => unlock(lockFp))
    .catch(handleError)
}

function fetchContributions (repoOwner) {
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

    if (OUT.length > 0) {
      saveContributions(result, OUT)
    }
  })
}

function pollContributions (owner, timeout) {
  fetchContributions(owner)
    .catch(handleError)
    .then(() => {
      console.log(chalk.grey(`>>> Waiting ${timeout / 1000} seconds...`))
      setTimeout(pollContributions.bind(null, owner, timeout), timeout)
    })
}

promptOwnerName().then((owner) => {
  if (POLL > 0) {
    pollContributions(owner, POLL * 1000)
  } else {
    fetchContributions(owner).catch(handleError)
  }
})
