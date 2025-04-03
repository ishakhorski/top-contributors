const fs = require('fs');
const path = require('path');

/**
 * Check if a user should be excluded based on the exclude patterns
 * @param {string} login - GitHub username
 * @param {string} email - User email address
 * @param {string[]} excludePatterns - Array of patterns to exclude
 * @returns {boolean} - True if the user should be excluded
 */
function shouldExcludeUser(login, email, excludePatterns = []) {
  if (!excludePatterns.length) return false;

  const escapeRegex = str => str.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&');

  return excludePatterns.some(pattern => {
    if (!pattern) return false;

    if (!pattern.includes('*')) {
      return pattern === login || pattern === email;
    }

    const regexPattern = escapeRegex(pattern).replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return [login, email].some(value => value && regex.test(value));
  });
}


/**
 * Generate Markdown for the contributors leaderboard
 * @param {Array<[string, number]>} sortedContributors - Array of [username, points]
 * @param {boolean} isOrg - Whether this is for an organization or repo
 * @param {string} orgName - Name of the organization (if applicable)
 * @returns {string} - Markdown content
 */
function generateLeaderboardMarkdown(sortedContributors) {
  if (!sortedContributors.length) {
    return '';
  }
  
  let tableRows = '';
  
  sortedContributors.forEach(([user, karma], index) => {
    tableRows += `| ${index + 1} | <a href="https://github.com/${user}"><img src="https://github.com/${user}.png" width="50px" style="border-radius:50%"><br /><sub>@${user}</sub></a> | ${karma} |\n`;
  });

  const tableHeader = '| Rank | User | Karma |\n| :---: | :---: | :---: |\n';
  
  return `\n${tableHeader}${tableRows}\n_Last updated: ${new Date().toISOString().split('T')[0]}_`;
}

/**
 * Write the leaderboard to a file
 * @param {string} filePath - Path where to write the file
 * @param {string} content - Content to write
 * @param {string} markerStart - Start marker
 * @param {string} markerEnd - End marker
 */
function writeLeaderboardToFile(filePath, content, markerStart = '', markerEnd = '') {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let fileContent = '';
    let finalContent = content;

    if (markerStart && markerEnd && fs.existsSync(filePath)) {
      fileContent = fs.readFileSync(filePath, 'utf8');
      
      const startIndex = fileContent.indexOf(markerStart);
      const endIndex = fileContent.indexOf(markerEnd);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        finalContent = fileContent.substring(0, startIndex + markerStart.length) +
                      '\n' + content + '\n' +
                      fileContent.substring(endIndex);
      }
    }
    
    fs.writeFileSync(filePath, finalContent);
    console.log(`✅ Leaderboard written to ${filePath}`);
  } catch (err) {
    console.error(`❌ Error writing to ${filePath}: ${err.message}`);
    throw err;
  }
}

module.exports = {
  shouldExcludeUser,
  generateLeaderboardMarkdown,
  writeLeaderboardToFile
};