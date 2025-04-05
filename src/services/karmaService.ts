import { GitHub } from "@actions/github/lib/utils";

import {
  getRepositoryPullRequests,
  getPullRequestReviews,
  getRepositoryIssues,
  getRepositoryCommits,
  getRepositoryComments,
} from "./githubService";

export type KarmaServiceState = Map<string, number>;
export type KarmaServiceConfig = {
  pull_request?: number;
  issue?: number;
  review?: number;
  commit?: number;
  comment?: number;
};

export class KarmaService {
  #state: KarmaServiceState;
  #config: KarmaServiceConfig;
  #exclude: RegExp[];

  constructor(config: KarmaServiceConfig, exclude: string[]) {
    this.#state = new Map<string, number>();
    this.#config = config;
    this.#exclude = exclude.map((pattern) => {
      const regexPattern = pattern
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".");
      return new RegExp(`^${regexPattern}$`, "i");
    });
  }

  getLeaderboard(): { username: string; points: number }[] {
    return Array.from(this.#state.entries())
      .map(([username, points]) => ({ username, points }))
      .sort((a, b) => b.points - a.points);
  }

  isExcluded(username: string, email: string): boolean {
    return this.#exclude.some(
      (pattern) => pattern.test(username) || pattern.test(email),
    );
  }

  async processRepository(
    { owner, repo }: { owner: string; repo: string },
    octokit: InstanceType<typeof GitHub>,
  ): Promise<void> {
    try {
      const config = this.#config;

      if (config.pull_request) {
        const points: number = config.pull_request;
        const pullRequests = await getRepositoryPullRequests(
          { owner, repo, state: "closed" },
          octokit,
        );
        const mergedPullRequests = pullRequests.filter(
          (pullRequest) => !!pullRequest.merged_at,
        );

        mergedPullRequests.forEach((pullRequest) => {
          if (
            pullRequest.user &&
            pullRequest.user.login &&
            !this.isExcluded(
              pullRequest.user.login,
              pullRequest.user.email || "",
            )
          ) {
            const username = pullRequest.user.login;
            this.#state.set(
              username,
              (this.#state.get(username) || 0) + points,
            );
          }
        });

        if (config.review) {
          const reviewPoints: number = config.review;
          const pullRequestReviews = await Promise.all(
            mergedPullRequests.map((pullRequest) =>
              getPullRequestReviews(
                { owner, repo, pull_number: pullRequest.number },
                octokit,
              ),
            ),
          );

          pullRequestReviews.forEach((reviews) => {
            reviews.forEach((review) => {
              if (
                review.user &&
                review.user.login &&
                !this.isExcluded(review.user.login, review.user.email || "")
              ) {
                const username = review.user.login;
                this.#state.set(
                  username,
                  (this.#state.get(username) || 0) + reviewPoints,
                );
              }
            });
          });
        }
      }

      if (config.issue) {
        const points: number = config.issue;
        const issues = await getRepositoryIssues(
          { owner, repo, state: "all" },
          octokit,
        );
        const pureIssues = issues.filter((issue) => !issue.pull_request);

        pureIssues.forEach((issue) => {
          if (
            issue.user &&
            issue.user.login &&
            !this.isExcluded(issue.user.login, issue.user.email || "")
          ) {
            const username = issue.user.login;
            this.#state.set(
              username,
              (this.#state.get(username) || 0) + points,
            );
          }
        });
      }

      if (config.commit) {
        const points: number = config.commit;
        const commits = await getRepositoryCommits({ owner, repo }, octokit);

        commits.forEach((commit) => {
          if (
            commit.author &&
            commit.author.login &&
            !this.isExcluded(commit.author.login, commit.author.email || "")
          ) {
            const username = commit.author.login;
            this.#state.set(
              username,
              (this.#state.get(username) || 0) + points,
            );
          }
        });
      }

      if (config.comment) {
        const points: number = config.comment;
        const comments = await getRepositoryComments({ owner, repo }, octokit);

        comments.forEach((comment) => {
          if (
            comment.user &&
            comment.user.login &&
            !this.isExcluded(comment.user.login, comment.user.email || "")
          ) {
            const username = comment.user.login;
            this.#state.set(
              username,
              (this.#state.get(username) || 0) + points,
            );
          }
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to process repository ${owner}/${repo}: ${(error as Error).message}`,
      );
    }
  }
}
