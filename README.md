# Top Contributors Action

![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github)

## Description

`Top Contributors Action` is a GitHub Action that generates a leaderboard of the top contributors to a repository based on their activity. It calculates karma points for contributors based on their commits, pull requests, issues, comments, and reviews.

## Features

- Calculates karma points for contributors:
    - **Comments**: +1 point
    - **Commits**: +2 points
    - **Issues**: +3 points
    - **Reviews**: +4 points
    - **Pull Requests**: +5 points
- Outputs a markdown leaderboard to a specified file (default: `CONTRIBUTORS.md`).
- Configurable limit for the number of top contributors displayed.

## Inputs

The action accepts the following inputs:

| Input   | Description                                                                 | Required | Default     |
|---------|-----------------------------------------------------------------------------|----------|-------------|
| `token` | GitHub Token to authenticate API requests.                                  | Yes      | N/A         |
| `output`| File path to write the karma leaderboard to (e.g., `CONTRIBUTORS.md`).      | No       | `CONTRIBUTORS.md` |
| `limit` | Limit the number of top contributors displayed in the leaderboard.          | No       | Unlimited   |

## Usage

To use this action in your repository, create a workflow file (e.g., `.github/workflows/top-contributors.yml`) with the following content:

```yaml
name: Generate Top Contributors Leaderboard

on:
  workflow_dispatch:        # manual trigger
  schedule:                    
    - cron: '0 0 * * 1'     # weekly trigger

jobs:
  generate-leaderboard:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate Top Contributors Leaderboard
        uses: ishakhorski/top-contributors@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          output: CONTRIBUTORS.md
          limit: 10
```

## License

This project is licensed under the MIT License.

## Author

Developed by Ivan Shakhorski.
