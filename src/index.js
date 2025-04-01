const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

const {
  getCommits,
  getPullRequests,
  getIssues,
  getReviewsForPR,
  getCommentsForIssue,
} = require('./github');

const { KARMA } = require('./karma');

async function fetchKarmaData(octokit, owner, repo) {
  const karmaMap = {};

  const addKarma = (login, points) => {
    if (login) {
      karmaMap[login] = (karmaMap[login] || 0) + points;
    }
  };

  const commits = await getCommits(octokit, owner, repo);
  commits.forEach((c) => addKarma(c.author?.login, KARMA.COMMIT));

  const prs = await getPullRequests(octokit, owner, repo);
  prs.forEach((pr) => addKarma(pr.user?.login, KARMA.PULL_REQUEST));

  const issues = await getIssues(octokit, owner, repo);
  await Promise.all(
    issues.map(async (issue) => {
      if (!issue.pull_request) {
        addKarma(issue.user?.login, KARMA.ISSUE);
      }

      const comments = await getCommentsForIssue(
        octokit,
        owner,
        repo,
        issue.number
      );
      comments.forEach((comment) =>
        addKarma(comment.user?.login, KARMA.COMMENT)
      );
    })
  );

  await Promise.all(
    prs.map(async (pr) => {
      const reviews = await getReviewsForPR(octokit, owner, repo, pr.number);
      reviews.forEach((review) =>
        addKarma(review.user?.login, KARMA.REVIEW)
      );
    })
  );

  return karmaMap;
}

function generateLeaderboardMarkdown(sorted) {
  const list = sorted.map(([login, points], i) => {
    const avatar = `https://github.com/${login}.png?size=24`;
    const profile = `https://github.com/${login}`;
    return `${i + 1}. [![avatar](${avatar})](${profile}) **@${login}** - ${points} karma`;
  }).join('\n');

  return `## 🏆 Top Contributors\n\n${list}`;
}

function writeLeaderboardToFile(filePath, content) {
  const fullPath = filePath.startsWith('./') ? filePath : `./${filePath}`;
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Karma leaderboard written to ${fullPath}`);
}

async function run() {
  try {
    const token = core.getInput('token');
    const outputPath = core.getInput('output') || 'CONTRIBUTORS.md';
    const limit = core.getInput('limit');
    const topLimit = limit ? parseInt(limit, 10) : null;

    if (!token) {
      core.setFailed('GitHub token is required.');
      return;
    }

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    const karmaMap = await fetchKarmaData(octokit, owner, repo);
    const sorted = Object.entries(karmaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit || undefined);
    const markdown = generateLeaderboardMarkdown(sorted);
    writeLeaderboardToFile(outputPath, markdown);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
