export const generateMarkdown = (
  leaderboard: { username: string; points: number }[]
): string => {
  if (!leaderboard.length) {
    return "";
  }

  const medals = ["🥇", "🥈", "🥉"];

  const header: string =
    "| 🏆 Rank | 👤 User | 🔥 Karma |\n|:-------:|:--------:|:--------:|";
  const rows: string[] = leaderboard.map(
    ({ username, points }, index) =>
      `| ${
        medals[index] || index + 1
      } | <a href="https://github.com/${username}">@${username}</a> | ${points} |`
  );
  const footer: string = `|:-------:|:--------:|:--------:|`;

  return `${header}\n${rows.join("\n")}\n${footer}${`_Last updated: ${
    new Date().toISOString().split("T")[0]
  }_`}`;
};
