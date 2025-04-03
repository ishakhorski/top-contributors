const { getOrganizationRepos } = require('../github');
const { calculateRepoKarma } = require('../karma/calculator');

async function runOrgMode(octokit, organization, excludePatterns = []) {
    const repos = await getOrganizationRepos(octokit, organization);
    const karmaMap = {};

    for (const repo of repos) {
        if (repo.archived || repo.size === 0) continue;

        try {
            const repoKarma = await calculateRepoKarma(
                octokit,
                organization,
                repo.name,
                excludePatterns
            );
            for (const [login, points] of Object.entries(repoKarma)) {
                karmaMap[login] = (karmaMap[login] || 0) + points;
            }
        } catch (err) {
            console.log(`⚠️ Failed to process repo ${repo.name}: ${err.message}`);
        }
    }

    return karmaMap;
}

module.exports = { runOrgMode };
