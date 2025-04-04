import { getOctokit } from "@actions/github";
import type { GitHub } from "@actions/github/lib/utils";

class GitHubService {
  #octokit: InstanceType<typeof GitHub>;

  constructor(token: string) {
    this.#octokit = getOctokit(token);
  }

  getPullRequests(options: {
    owner: string;
    repo: string;
    state?: "all" | "open" | "closed";
  }) {
    try {
      const { owner, repo, state } = options;

      return this.#octokit.paginate(this.#octokit.rest.pulls.list, {
        owner,
        repo,
        state,
      });
    } catch (error) {
      throw new Error(`Failed to get pull requests: ${error}`);
    }
  }

  getIssues(options: {
    owner: string;
    repo: string;
    state?: "all" | "open" | "closed";
  }) {
    try {
      const { owner, repo, state } = options;

      return this.#octokit.paginate(this.#octokit.rest.issues.listForRepo, {
        owner,
        repo,
        state,
      });
    } catch (error) {
      throw new Error(`Failed to get issues: ${error}`);
    }
  }

  getCommits(options: { owner: string; repo: string }) {
    try {
      const { owner, repo } = options;

      return this.#octokit.paginate(this.#octokit.rest.repos.listCommits, {
        owner,
        repo,
      });
    } catch (error) {
      throw new Error(`Failed to get commits: ${error}`);
    }
  }

  getReviewsForPullRequest(options: {
    owner: string;
    repo: string;
    pull_number: number;
  }) {
    try {
      const { owner, repo, pull_number } = options;

      return this.#octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number,
      });
    } catch (error) {
      throw new Error(`Failed to get reviews: ${error}`);
    }
  }

  getCommentsForIssue(options: {
    owner: string;
    repo: string;
    issue_number: number;
  }) {
    try {
      const { owner, repo, issue_number } = options;

      return this.#octokit.paginate(this.#octokit.rest.issues.listComments, {
        owner,
        repo,
        issue_number,
      });
    } catch (error) {
      throw new Error(`Failed to get comments: ${error}`);
    }
  }

  getOrganizationRepos(options: { org: string }) {
    try {
      const { org } = options;

      return this.#octokit.paginate(this.#octokit.rest.repos.listForOrg, {
        org,
        per_page: 100,
        sort: "updated",
        direction: "desc",
      });
    } catch (error) {
      throw new Error(`Failed to get organization repos: ${error}`);
    }
  }
}

export default GitHubService;
export type { GitHubService };
