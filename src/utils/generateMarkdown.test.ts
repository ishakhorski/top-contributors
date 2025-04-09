import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { generateMarkdown } from "./generateMarkdown";

describe("generateMarkdown", () => {
  const mockDate = new Date("2023-07-15");
  const realDate = global.Date;

  beforeEach(() => {
    global.Date = vi.fn(() => mockDate) as any;
  });

  afterEach(() => {
    global.Date = realDate;
  });

  it("should return empty string for empty leaderboard", () => {
    expect(generateMarkdown([])).toBe("");
  });

  it("should generate markdown for a single user", () => {
    const leaderboard = [{ username: "user1", points: 100 }];
    const result = generateMarkdown(leaderboard);

    expect(result).toContain("| 🏆 Rank | 👤 User | 🔥 Karma |");
    expect(result).toContain(
      '| 🥇 | <a href="https://github.com/user1">@user1</a> | 100 |'
    );
    expect(result).toContain("_Last updated: 2023-07-15_");
  });

  it("should generate markdown with medals for top 3 users", () => {
    const leaderboard = [
      { username: "user1", points: 300 },
      { username: "user2", points: 200 },
      { username: "user3", points: 100 },
    ];
    const result = generateMarkdown(leaderboard);

    expect(result).toContain(
      '| 🥇 | <a href="https://github.com/user1">@user1</a> | 300 |'
    );
    expect(result).toContain(
      '| 🥈 | <a href="https://github.com/user2">@user2</a> | 200 |'
    );
    expect(result).toContain(
      '| 🥉 | <a href="https://github.com/user3">@user3</a> | 100 |'
    );
  });

  it("should generate markdown with numbering for users beyond top 3", () => {
    const leaderboard = [
      { username: "user1", points: 500 },
      { username: "user2", points: 400 },
      { username: "user3", points: 300 },
      { username: "user4", points: 200 },
      { username: "user5", points: 100 },
    ];
    const result = generateMarkdown(leaderboard);

    expect(result).toContain(
      '| 4 | <a href="https://github.com/user4">@user4</a> | 200 |'
    );
    expect(result).toContain(
      '| 5 | <a href="https://github.com/user5">@user5</a> | 100 |'
    );
  });

  it("should format the entire markdown correctly", () => {
    const leaderboard = [
      { username: "user1", points: 200 },
      { username: "user2", points: 100 },
    ];

    const expected =
      "| 🏆 Rank | 👤 User | 🔥 Karma |\n" +
      "|:-------:|:--------:|:--------:|\n" +
      '| 🥇 | <a href="https://github.com/user1">@user1</a> | 200 |\n' +
      '| 🥈 | <a href="https://github.com/user2">@user2</a> | 100 |\n\n' +
      "_Last updated: 2023-07-15_";

    expect(generateMarkdown(leaderboard)).toBe(expected);
  });
});
