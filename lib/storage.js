const fs = require('fs')
const promisify = require('es6-promisify')
const lockfile = require('lockfile')

const chalk = require('chalk')

const writeFile = promisify(fs.writeFile, fs)
const readFile = promisify(fs.readFile, fs)
const lock = promisify(lockfile.lock, lockfile)
const unlock = promisify(lockfile.unlock, lockfile)

function writeJSON (fp, json) {
  const lockFp = `${fp}.lock`
  const data = JSON.stringify(json)

  const unlockFp = () => unlock(lockFp)

  const writeFp = () => {
    console.log(chalk.green(`>>> Saving to ${fp}`))
    return writeFile(fp, data)
  }

  const writeFpIfChanged = (oldData) => {
    if (data !== oldData) {
      return writeFp()
    }
  }

  return lock(lockFp)
    .then(() => readFile(fp, 'utf8').then(writeFpIfChanged, writeFp))
    .then(unlockFp, (err) => { unlockFp();  throw err })
}

module.exports = {
  writeJSON,
}
