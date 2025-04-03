const { KARMA } = require('./config.js');
const { 
  getCommits, 
  getPullRequests, 
  getIssues, 
  getReviewsForPR, 
  getCommentsForIssue 
} = require('../github.js');
const { shouldExcludeUser } = require('../utils');

async function calculateRepoKarma(octokit, owner, repo, excludePatterns = []) {
  const karmaMap = {};

  const addKarma = (login, points, email) => {
    if (login && !shouldExcludeUser(login, email, excludePatterns)) {
      karmaMap[login] = (karmaMap[login] || 0) + points;
    }
  };

  const commits = await getCommits(octokit, owner, repo);
  commits.forEach(c => 
    addKarma(c.author?.login, KARMA.COMMIT, c.commit?.author?.email)
  );

  const prs = await getPullRequests(octokit, owner, repo);
  prs.forEach(pr => 
    addKarma(pr.user?.login, KARMA.PULL_REQUEST)
  );

  const issues = await getIssues(octokit, owner, repo);
  await Promise.all(
    issues.map(async issue => {
      if (!issue.pull_request) {
        addKarma(issue.user?.login, KARMA.ISSUE);
      }
      const comments = await getCommentsForIssue(octokit, owner, repo, issue.number);
      comments.forEach(comment => 
        addKarma(comment.user?.login, KARMA.COMMENT)
      );
    })
  );

  await Promise.all(
    prs.map(async pr => {
      const reviews = await getReviewsForPR(octokit, owner, repo, pr.number);
      reviews.forEach(review => 
        addKarma(review.user?.login, KARMA.REVIEW)
      );
    })
  );

  return karmaMap;
}

module.exports = { calculateRepoKarma };
