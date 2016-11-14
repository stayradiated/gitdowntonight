#! /usr/bin/env node

const inquirer = require('inquirer')
const chalk = require('chalk')
const flags = require('flags')

const {calculateTotalContributions} = require('../lib')
const {writeJSON} = require('../lib/storage')

flags.defineInteger('poll', 0, 'Polling mode')
flags.defineInteger('limit', 15, 'Limit results')
flags.defineString('owner', '', 'Owner')
flags.defineString('out', '', 'Write ranking to text file')
flags.parse()

const POLL = flags.get('poll')
const LIMIT = flags.get('limit')
const OWNER = flags.get('owner')
const OUT = flags.get('out')

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

function fetchContributions (repoOwner) {
  console.log(chalk.grey('>>> Processing repositories...'))
  return calculateTotalContributions(repoOwner, LIMIT)
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
        return writeJSON(OUT, result).catch(handleError)
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
