import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  getRepositoryPullRequests,
  getRepositoryIssues,
  getPullRequestReviews,
  getRepositoryCommits,
  getRepositoryComments,
  getOrganizationRepositories,
} from "./githubService";

const createMockOctokit = () => {
  return {
    paginate: vi.fn(),
    rest: {
      pulls: {
        list: "pulls.list",
        listReviews: "pulls.listReviews",
      },
      issues: {
        listForRepo: "issues.listForRepo",
        listCommentsForRepo: "issues.listCommentsForRepo",
      },
      repos: {
        listCommits: "repos.listCommits",
        listForOrg: "repos.listForOrg",
      },
    },
  };
};

describe("githubService", () => {
  let mockOctokit: any;

  beforeEach(() => {
    mockOctokit = createMockOctokit();
    vi.clearAllMocks();
  });

  describe("getRepositoryPullRequests", () => {
    it("should fetch pull requests successfully", async () => {
      const mockPRs = [{ id: 1 }, { id: 2 }];
      mockOctokit.paginate.mockResolvedValue(mockPRs);

      const result = await getRepositoryPullRequests(
        { owner: "testowner", repo: "testrepo", state: "open" },
        mockOctokit,
      );

      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        "pulls.list",
        { owner: "testowner", repo: "testrepo", state: "open" },
        expect.any(Function),
      );
      expect(result).toEqual(mockPRs);
    });

    it("should throw an error when the API call fails", async () => {
      mockOctokit.paginate.mockRejectedValue(new Error("API error"));

      await expect(
        getRepositoryPullRequests(
          { owner: "testowner", repo: "testrepo", state: "open" },
          mockOctokit,
        ),
      ).rejects.toThrow(
        "Failed to get pull requests for testowner/testrepo: API error",
      );
    });
  });

  describe("getRepositoryIssues", () => {
    it("should fetch issues successfully", async () => {
      const mockIssues = [{ id: 1 }, { id: 2 }];
      mockOctokit.paginate.mockResolvedValue(mockIssues);

      const result = await getRepositoryIssues(
        { owner: "testowner", repo: "testrepo", state: "all" },
        mockOctokit,
      );

      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        "issues.listForRepo",
        { owner: "testowner", repo: "testrepo", state: "all" },
        expect.any(Function),
      );
      expect(result).toEqual(mockIssues);
    });

    it("should throw an error when the API call fails", async () => {
      mockOctokit.paginate.mockRejectedValue(new Error("API error"));

      await expect(
        getRepositoryIssues(
          { owner: "testowner", repo: "testrepo", state: "all" },
          mockOctokit,
        ),
      ).rejects.toThrow(
        "Failed to get issues for testowner/testrepo: API error",
      );
    });
  });

  describe("getPullRequestReviews", () => {
    it("should fetch PR reviews successfully", async () => {
      const mockReviews = [{ id: 1 }, { id: 2 }];
      mockOctokit.paginate.mockResolvedValue(mockReviews);

      const result = await getPullRequestReviews(
        { owner: "testowner", repo: "testrepo", pull_number: 123 },
        mockOctokit,
      );

      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        "pulls.listReviews",
        { owner: "testowner", repo: "testrepo", pull_number: 123 },
        expect.any(Function),
      );
      expect(result).toEqual(mockReviews);
    });

    it("should throw an error when the API call fails", async () => {
      mockOctokit.paginate.mockRejectedValue(new Error("API error"));

      await expect(
        getPullRequestReviews(
          { owner: "testowner", repo: "testrepo", pull_number: 123 },
          mockOctokit,
        ),
      ).rejects.toThrow(
        "Failed to get reviews for testowner/testrepo: API error",
      );
    });
  });

  describe("getRepositoryCommits", () => {
    it("should fetch commits successfully", async () => {
      const mockCommits = [{ sha: "abc123" }, { sha: "def456" }];
      mockOctokit.paginate.mockResolvedValue(mockCommits);

      const result = await getRepositoryCommits(
        { owner: "testowner", repo: "testrepo" },
        mockOctokit,
      );

      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        "repos.listCommits",
        { owner: "testowner", repo: "testrepo" },
        expect.any(Function),
      );
      expect(result).toEqual(mockCommits);
    });

    it("should throw an error when the API call fails", async () => {
      mockOctokit.paginate.mockRejectedValue(new Error("API error"));

      await expect(
        getRepositoryCommits(
          { owner: "testowner", repo: "testrepo" },
          mockOctokit,
        ),
      ).rejects.toThrow(
        "Failed to get commits for testowner/testrepo: API error",
      );
    });
  });

  describe("getRepositoryComments", () => {
    it("should fetch comments successfully", async () => {
      const mockComments = [{ id: 1 }, { id: 2 }];
      mockOctokit.paginate.mockResolvedValue(mockComments);

      const result = await getRepositoryComments(
        { owner: "testowner", repo: "testrepo" },
        mockOctokit,
      );

      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        "issues.listCommentsForRepo",
        { owner: "testowner", repo: "testrepo" },
        expect.any(Function),
      );
      expect(result).toEqual(mockComments);
    });

    it("should throw an error when the API call fails", async () => {
      mockOctokit.paginate.mockRejectedValue(new Error("API error"));

      await expect(
        getRepositoryComments(
          { owner: "testowner", repo: "testrepo" },
          mockOctokit,
        ),
      ).rejects.toThrow(
        "Failed to get comments for testowner/testrepo: API error",
      );
    });
  });

  describe("getOrganizationRepositories", () => {
    it("should fetch organization repositories successfully", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockOctokit.paginate.mockResolvedValue(mockRepos);

      const result = await getOrganizationRepositories(
        { org: "testorg", type: "public" },
        mockOctokit,
      );

      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        "repos.listForOrg",
        { org: "testorg", type: "public" },
        expect.any(Function),
      );
      expect(result).toEqual(mockRepos);
    });

    it("should throw an error when the API call fails", async () => {
      mockOctokit.paginate.mockRejectedValue(new Error("API error"));

      await expect(
        getOrganizationRepositories(
          { org: "testorg", type: "public" },
          mockOctokit,
        ),
      ).rejects.toThrow(
        "Failed to get repositories for organization testorg: API error",
      );
    });
  });
});
