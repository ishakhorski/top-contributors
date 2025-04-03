const { calculateRepoKarma } = require('../karma/calculator');

async function runRepoMode(octokit, owner, repo, excludePatterns = []) {
    return await calculateRepoKarma(octokit, owner, repo, excludePatterns);
}

module.exports = { runRepoMode };