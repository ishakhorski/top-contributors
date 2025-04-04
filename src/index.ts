import { getInput, setFailed } from "@actions/core";
import { context } from "@actions/github";

import GitHubService from "./services/github";
import KarmaService from "./services/karma";

async function run() {
  try {
    const token: string = getInput("token", { required: true });
    if (!token) {
      throw new Error("GitHub token is required");
    }

    const githubService = new GitHubService(token);

    const karmaConfig = JSON.parse(getInput("config"));
    const excludeConfig: string[] = JSON.parse(getInput("exclude") || "[]");

    const karmaService = new KarmaService(
      githubService,
      karmaConfig,
      excludeConfig
    );

    const organization: string | null = getInput("organization") || null;
    if (organization) {
      const repos = await githubService.getOrganizationRepos({
        org: organization,
      });
      await Promise.all(
        repos.map(async ({ name, owner }) =>
          karmaService.calculateRepoKarma({ owner: owner.name!, repo: name })
        )
      );
    } else {
      const { owner, repo } = context.repo;
      karmaService.calculateRepoKarma({ owner, repo });
    }

    const limit = getInput("limit");
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    const outputPath = getInput("output") || "CONTRIBUTORS.md";
  } catch (err: unknown) {
    setFailed((err as Error)?.message || "Unknown error");
  }
}

run();
