import { getInput, setFailed, info } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { KarmaService, type KarmaServiceConfig } from "./services/karmaService";
import { getOrganizationRepositories } from "./services/githubService";

import { generateMarkdown } from "./utils/generateMarkdown";
import { writeMarkdown } from "./utils/writeMarkdown";

export async function run() {
  try {
    const token: string = getInput("token", { required: true });
    if (!token) {
      throw new Error("Token is required");
    }

    const octokit = getOctokit(token);

    const karmaConfig: string = getInput("config");
    const karmaConfigParsed: KarmaServiceConfig = karmaConfig
      ? JSON.parse(karmaConfig)
      : { pull_request: 10, issue: 5, review: 3, commit: 2, comment: 1 };
    info(
      karmaConfig
        ? `Karma config: ${karmaConfig}`
        : "No karma config provided, using default values",
    );

    const exclude: string = getInput("exclude");
    const excludeParsed: string[] = exclude ? JSON.parse(exclude) : [];

    const karmaService: InstanceType<typeof KarmaService> = new KarmaService(
      karmaConfigParsed,
      excludeParsed,
    );

    const organization: string | null = getInput("organization") || null;
    if (organization) {
      info(`Run in organization mode: ${organization}`);

      const orgRepos: { repo: string; owner: string }[] =
        await getOrganizationRepositories(
          { org: organization, type: "public" },
          octokit,
        ).then((repositories) =>
          repositories.map((repo) => ({
            repo: repo.name,
            owner: organization,
          })),
        );

      info(
        `Found ${orgRepos.length} repositories in organization ${organization}`,
      );

      await Promise.all(
        orgRepos.map(async ({ repo, owner }) =>
          karmaService.processRepository({ owner, repo }, octokit),
        ),
      );
    } else {
      const { owner, repo } = context.repo;

      info(`Run in repository mode: ${owner}/${repo}`);

      await karmaService.processRepository({ owner, repo }, octokit);
    }

    let leaderboard: { username: string; points: number }[] =
      karmaService.getLeaderboard();
    const limit: string = getInput("limit");
    const parsedLimit: number | null = limit ? parseInt(limit, 10) : null;
    info(
      parsedLimit
        ? `Leaderboard with limit: ${parsedLimit} entries`
        : "No limit provided, showing all leaderboard entries",
    );

    if (parsedLimit) {
      leaderboard = leaderboard.slice(0, parsedLimit);
    }

    const markdown: string = generateMarkdown(leaderboard);

    const output: string = getInput("output") || "CONTRIBUTORS.md";
    info(`Writing markdown to file: ${output}`);

    const marker_start: string | null = getInput("marker-start") || null;
    const marker_end: string | null = getInput("marker-end") || null;

    if (marker_start && marker_end) {
      info(
        `Using custom markers: ${marker_start} and ${marker_end}. This will overwrite the file content between these markers.`,
      );
      writeMarkdown(output, markdown, { marker_start, marker_end });
    } else {
      info(
        "No markers provided, writing markdown to file. This will overwrite the file content.",
      );
      writeMarkdown(output, markdown);
    }
  } catch (error) {
    setFailed(`Action failed: ${(error as Error).message}`);
  }
}

run();
