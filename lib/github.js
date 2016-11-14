const {request, graphql} = require('./utils')

function parseRepositories (result) {
  // check if we are going over the API limits
  if (result.message != null) {
    throw new Error(result.message)
  }

  return result.data.repositoryOwner.repositories.edges.map((edge) => {
    return edge.node.name
  })
}

function fetchRepositories (owner) {
  return graphql({
    variables: {owner},
    query: `query fetchRepositories($owner: String!) {
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
  })
    .then(parseRepositories)
}

function parseContributors (result) {
  return result.map((contributor) => {
    return {
      id: contributor.login,
      contributions: contributor.contributions,
    }
  })
}

function fetchContributors (owner, repo) {
  return request('GET', `/repos/${owner}/${repo}/contributors`)
    .then(parseContributors)
}


module.exports = {
  parseRepositories,
  fetchRepositories,
  parseContributors,
  fetchContributors,
}
