import { describe, it, expect, vi, beforeEach } from "vitest";
import { KarmaService } from "./karmaService";
import * as githubService from "./githubService";

describe("KarmaService", () => {
  let karmaService: KarmaService;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with empty state", () => {
      karmaService = new KarmaService({}, []);
      expect(karmaService.getLeaderboard()).toEqual([]);
    });

    it("should convert exclude patterns to regular expressions", () => {
      karmaService = new KarmaService({}, ["bot*", "dependabot"]);
      expect(karmaService.isExcluded("bot123", "")).toBe(true);
      expect(karmaService.isExcluded("dependabot", "")).toBe(true);
      expect(karmaService.isExcluded("user", "")).toBe(false);
    });
  });

  describe("isExcluded", () => {
    beforeEach(() => {
      karmaService = new KarmaService({}, [
        "bot*",
        "test.user",
        "user@example.com",
      ]);
    });

    it("should exclude usernames matching patterns", () => {
      expect(karmaService.isExcluded("bot1", "")).toBe(true);
      expect(karmaService.isExcluded("botname", "")).toBe(true);
      expect(karmaService.isExcluded("test.user", "")).toBe(true);
    });

    it("should exclude emails matching patterns", () => {
      expect(karmaService.isExcluded("", "user@example.com")).toBe(true);
      expect(karmaService.isExcluded("", "other@example.com")).toBe(false);
    });

    it("should not exclude non-matching usernames or emails", () => {
      expect(karmaService.isExcluded("normaluser", "normal@example.com")).toBe(
        false,
      );
    });
  });

  describe("processRepository", () => {
    const octokit = {} as any;
    const repo = { owner: "testorg", repo: "testrepo" };

    beforeEach(() => {
      vi.spyOn(githubService, "getRepositoryPullRequests").mockResolvedValue([
        { number: 1, merged_at: "2023-01-01", user: { login: "user1" } },
        { number: 2, merged_at: null, user: { login: "user2" } },
        { number: 3, merged_at: "2023-01-03", user: { login: "botuser" } },
      ] as any);

      vi.spyOn(githubService, "getPullRequestReviews").mockImplementation(
        (params: any) => {
          if (params.pull_number === 1) {
            return Promise.resolve([
              { user: { login: "user2" } },
              { user: { login: "user3" } },
            ] as any);
          }
          return Promise.resolve([]);
        },
      );

      vi.spyOn(githubService, "getRepositoryIssues").mockResolvedValue([
        { user: { login: "user1" } },
        { user: { login: "user2" } },
      ] as any);

      vi.spyOn(githubService, "getRepositoryCommits").mockResolvedValue([
        { author: { login: "user1", email: "user1@example.com" } },
        { author: { login: "user3", email: "user3@example.com" } },
        { author: { login: "botuser", email: "bot@example.com" } },
      ] as any);

      vi.spyOn(githubService, "getRepositoryComments").mockResolvedValue([
        { user: { login: "user1" } },
        { user: { login: "user2" } },
      ] as any);
    });

    it("should process pull requests and award points", async () => {
      karmaService = new KarmaService({ pull_request: 5 }, ["bot*"]);
      await karmaService.processRepository(repo, octokit);

      const leaderboard = karmaService.getLeaderboard();
      expect(leaderboard).toEqual([{ username: "user1", points: 5 }]);
      expect(githubService.getRepositoryPullRequests).toHaveBeenCalledWith(
        { owner: "testorg", repo: "testrepo", state: "closed" },
        octokit,
      );
    });

    it("should process reviews and award points", async () => {
      karmaService = new KarmaService({ pull_request: 5, review: 3 }, ["bot*"]);
      await karmaService.processRepository(repo, octokit);

      const leaderboard = karmaService.getLeaderboard();
      expect(leaderboard).toContainEqual({ username: "user2", points: 3 });
      expect(leaderboard).toContainEqual({ username: "user3", points: 3 });
    });

    it("should process issues and award points", async () => {
      karmaService = new KarmaService({ issue: 2 }, ["bot*"]);
      await karmaService.processRepository(repo, octokit);

      const leaderboard = karmaService.getLeaderboard();
      expect(leaderboard).toEqual([
        { username: "user1", points: 2 },
        { username: "user2", points: 2 },
      ]);
    });

    it("should process commits and award points", async () => {
      karmaService = new KarmaService({ commit: 4 }, ["bot*"]);
      await karmaService.processRepository(repo, octokit);

      const leaderboard = karmaService.getLeaderboard();
      expect(leaderboard).toEqual([
        { username: "user1", points: 4 },
        { username: "user3", points: 4 },
      ]);
    });

    it("should process comments and award points", async () => {
      karmaService = new KarmaService({ comment: 1 }, ["bot*"]);
      await karmaService.processRepository(repo, octokit);

      const leaderboard = karmaService.getLeaderboard();
      expect(leaderboard).toEqual([
        { username: "user1", points: 1 },
        { username: "user2", points: 1 },
      ]);
    });

    it("should process all contribution types", async () => {
      karmaService = new KarmaService(
        { pull_request: 5, issue: 2, review: 3, commit: 4, comment: 1 },
        ["bot*"],
      );
      await karmaService.processRepository(repo, octokit);

      const leaderboard = karmaService.getLeaderboard();
      expect(leaderboard).toContainEqual({ username: "user1", points: 12 }); // 5(PR) + 2(issue) + 4(commit) + 1(comment)
      expect(leaderboard).toContainEqual({ username: "user2", points: 6 }); // 3(review) + 2(issue) + 1(comment)
      expect(leaderboard).toContainEqual({ username: "user3", points: 7 }); // 3(review) + 4(commit)
    });

    it("should throw error when processing repository fails", async () => {
      vi.spyOn(githubService, "getRepositoryPullRequests").mockRejectedValue(
        new Error("API error"),
      );

      karmaService = new KarmaService({ pull_request: 5 }, []);

      await expect(
        karmaService.processRepository(repo, octokit),
      ).rejects.toThrow(
        "Failed to process repository testorg/testrepo: API error",
      );
    });
  });
});
