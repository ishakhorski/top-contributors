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

/**
 * Check if a login or email should be excluded based on patterns
 * @param {string} login - User login to check
 * @param {string} email - User email to check (optional)
 * @param {string[]} excludePatterns - Array of patterns to match against
 * @returns {boolean} - True if user should be excluded
 */
function shouldExcludeUser(login, email, excludePatterns) {
  if (!excludePatterns || excludePatterns.length === 0) return false;
  
  for (const pattern of excludePatterns) {
    // Direct match on login
    if (pattern === login) return true;
    
    // Direct match on email
    if (email && pattern === email) return true;
    
    // Handle wildcard patterns
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      if (regex.test(login)) return true;
      if (email && regex.test(email)) return true;
    }
  }
  
  return false;
}

async function fetchKarmaData(octokit, owner, repo, excludePatterns) {
  const karmaMap = {};

  const addKarma = (login, points, email) => {
    if (login && !shouldExcludeUser(login, email, excludePatterns)) {
      karmaMap[login] = (karmaMap[login] || 0) + points;
    }
  };

  const commits = await getCommits(octokit, owner, repo);
  commits.forEach((c) => {
    const email = c.commit?.author?.email;
    addKarma(c.author?.login, KARMA.COMMIT, email);
  });

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

function writeLeaderboardToFile(filePath, content, markerStart, markerEnd) {
  const fullPath = filePath.startsWith('./') ? filePath : `./${filePath}`;
  
  // Check if file exists
  const fileExists = fs.existsSync(fullPath);
  
  // If no markers are provided, write the content directly
  if (!markerStart || !markerEnd) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Karma leaderboard written to ${fullPath}`);
    return;
  }

  // If file doesn't exist, create it with markers
  if (!fileExists) {
    const newFileContent = `${markerStart}\n${content}\n${markerEnd}`;
    fs.writeFileSync(fullPath, newFileContent, 'utf8');
    console.log(`✅ Created new file ${fullPath} with karma leaderboard`);
    return;
  }
  
  // Read the existing file content
  let fileContent = fs.readFileSync(fullPath, 'utf8');
  
  // Look for the markers in the file
  const startIndex = fileContent.indexOf(markerStart);
  const endIndex = fileContent.indexOf(markerEnd);
  
  if (startIndex === -1 || endIndex === -1) {
    console.log(`⚠️ Markers not found in file. Adding markers and content to ${fullPath}`);
    // Markers not found, appending everything to the file
    fileContent += `\n\n${markerStart}\n${content}\n${markerEnd}`;
  } else {
    // Markers found, replace the content between them
    fileContent = fileContent.substring(0, startIndex + markerStart.length) + 
                  '\n' + content + '\n' + 
                  fileContent.substring(endIndex);
  }
  
  // Write the modified content back to file
  fs.writeFileSync(fullPath, fileContent, 'utf8');
  console.log(`✅ Karma leaderboard updated between markers in ${fullPath}`);
}

async function run() {
  try {
    const token = core.getInput('token');
    const outputPath = core.getInput('output') || 'CONTRIBUTORS.md';
    const limit = core.getInput('limit');
    const topLimit = limit ? parseInt(limit, 10) : null;
    const markerStart = core.getInput('marker_start');
    const markerEnd = core.getInput('marker_end');
    
    // Parse exclude patterns from JSON input
    let excludePatterns = [];
    const excludeInput = core.getInput('exclude');
    if (excludeInput) {
      try {
        excludePatterns = JSON.parse(excludeInput);
        if (!Array.isArray(excludePatterns)) {
          console.log('⚠️ Exclude patterns should be a JSON array. Using empty array instead.');
          excludePatterns = [];
        } else {
          console.log(`ℹ️ Excluding patterns: ${excludePatterns.join(', ')}`);
        }
      } catch (err) {
        console.log(`⚠️ Error parsing exclude patterns: ${err.message}. Using empty array.`);
        excludePatterns = [];
      }
    }

    if (!token) {
      core.setFailed('GitHub token is required.');
      return;
    }

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    const karmaMap = await fetchKarmaData(octokit, owner, repo, excludePatterns);
    const sorted = Object.entries(karmaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit || undefined);
    const markdown = generateLeaderboardMarkdown(sorted);
    writeLeaderboardToFile(outputPath, markdown, markerStart, markerEnd);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();