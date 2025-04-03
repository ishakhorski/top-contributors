async function getCommits(octokit, owner, repo) {
    return await octokit.paginate(octokit.rest.repos.listCommits, { owner, repo });
}

async function getPullRequests(octokit, owner, repo) {
    return await octokit.paginate(octokit.rest.pulls.list, {
        owner,
        repo,
        state: 'all',
    });
}

async function getIssues(octokit, owner, repo) {
    return await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner,
        repo,
        state: 'all',
    });
}

async function getReviewsForPR(octokit, owner, repo, number) {
    const { data } = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: number,
    });
    return data;
}

async function getCommentsForIssue(octokit, owner, repo, number) {
    return await octokit.paginate(octokit.rest.issues.listComments, {
        owner,
        repo,
        issue_number: number,
    });
}

async function getOrganizationRepos(octokit, org) {
    return await octokit.paginate(octokit.rest.repos.listForOrg, {
        org,
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
    });
}

module.exports = {
    getCommits,
    getPullRequests,
    getIssues,
    getReviewsForPR,
    getCommentsForIssue,
    getOrganizationRepos,
};
