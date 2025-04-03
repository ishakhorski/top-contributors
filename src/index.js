const core = require('@actions/core');
const github = require('@actions/github');
const { runRepoMode } = require('./runners/repoRunner');
const { runOrgMode } = require('./runners/orgRunner');
const { generateLeaderboardMarkdown, writeLeaderboardToFile } = require('./utils');

async function run() {
  try {
    const token = core.getInput('token');
    const outputPath = core.getInput('output') || 'CONTRIBUTORS.md';
    const limit = parseInt(core.getInput('limit') || '0', 10);
    const organization = core.getInput('organization');
    const excludeInput = core.getInput('exclude') || '[]';
    const excludePatterns = JSON.parse(excludeInput);
    const octokit = github.getOctokit(token);

    let karmaMap;
    if (organization) {
      karmaMap = await runOrgMode(octokit, organization, excludePatterns);
    } else {
      const { owner, repo } = github.context.repo;
      karmaMap = await runRepoMode(octokit, owner, repo, excludePatterns);
    }

    const sorted = Object.entries(karmaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || undefined);

    const markdown = generateLeaderboardMarkdown(
      sorted
    );

    writeLeaderboardToFile(
      outputPath,
      markdown,
      core.getInput('marker_start'),
      core.getInput('marker_end')
    );
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
