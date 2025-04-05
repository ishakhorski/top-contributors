import { GitHub } from "@actions/github/lib/utils";

export async function getRepositoryPullRequests(
  {
    owner,
    repo,
    state,
  }: {
    owner: string;
    repo: string;
    state: "open" | "closed" | "all";
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const pullRequests = await octokit.paginate(
      octokit.rest.pulls.list,
      {
        owner,
        repo,
        state,
      },
      (response) => response.data,
    );

    return pullRequests;
  } catch (error) {
    throw new Error(
      `Failed to get pull requests for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

export async function getRepositoryIssues(
  {
    owner,
    repo,
    state,
  }: {
    owner: string;
    repo: string;
    state: "open" | "closed" | "all";
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const issues = await octokit.paginate(
      octokit.rest.issues.listForRepo,
      {
        owner,
        repo,
        state,
      },
      (response) => response.data,
    );

    return issues;
  } catch (error) {
    throw new Error(
      `Failed to get issues for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

export async function getPullRequestReviews(
  {
    owner,
    repo,
    pull_number,
  }: {
    owner: string;
    repo: string;
    pull_number: number;
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const reviews = await octokit.paginate(
      octokit.rest.pulls.listReviews,
      {
        owner,
        repo,
        pull_number,
      },
      (response) => response.data,
    );

    return reviews;
  } catch (error) {
    throw new Error(
      `Failed to get reviews for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

export async function getIssueReactions(
  {
    owner,
    repo,
    issue_number,
  }: {
    owner: string;
    repo: string;
    issue_number: number;
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const reactions = await octokit.paginate(
      octokit.rest.reactions.listForIssue,
      {
        owner,
        repo,
        issue_number,
      },
      (response) => response.data,
    );

    return reactions;
  } catch (error) {
    throw new Error(
      `Failed to get issue reeactions for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

export async function getRepositoryCommits(
  {
    owner,
    repo,
  }: {
    owner: string;
    repo: string;
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const commits = await octokit.paginate(
      octokit.rest.repos.listCommits,
      {
        owner,
        repo,
      },
      (response) => response.data,
    );

    return commits;
  } catch (error) {
    throw new Error(
      `Failed to get commits for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

export async function getRepositoryComments(
  {
    owner,
    repo,
  }: {
    owner: string;
    repo: string;
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const comments = await octokit.paginate(
      octokit.rest.issues.listCommentsForRepo,
      {
        owner,
        repo,
      },
      (response) => response.data,
    );

    return comments;
  } catch (error) {
    throw new Error(
      `Failed to get comments for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

export async function getOrganizationRepositories(
  {
    org,
    type,
  }: {
    org: string;
    type: "public" | "private" | "forks" | "sources" | "member";
  },
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const repos = await octokit.paginate(
      octokit.rest.repos.listForOrg,
      {
        org,
        type,
      },
      (response) => response.data,
    );

    return repos;
  } catch (error) {
    throw new Error(
      `Failed to get repositories for organization ${org}: ${(error as Error).message}`,
    );
  }
}
