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
- Supports insertion between markers in existing files.
- Option to exclude contributors based on usernames, email patterns, or wildcards.
- Support for analyzing contributions across all repositories in an organization.

## Inputs

The action accepts the following inputs:

| Input          | Description                                                                                         | Required | Default     |
|----------------|-----------------------------------------------------------------------------------------------------|----------|-------------|
| `token`        | GitHub Token to authenticate API requests.                                                          | Yes      | N/A         |
| `output`       | File path to write the karma leaderboard to (e.g., `CONTRIBUTORS.md`).                              | No       | `CONTRIBUTORS.md` |
| `limit`        | Limit the number of top contributors displayed in the leaderboard.                                  | No       | Unlimited   |
| `marker_start` | Start marker to identify where to insert content (e.g., `<!-- TOP-CONTRIBUTORS-START -->`).         | No       | `''` (empty) |
| `marker_end`   | End marker to identify where content insertion should end (e.g., `<!-- TOP-CONTRIBUTORS-END -->`).  | No       | `''` (empty) |
| `exclude`      | JSON array of patterns or emails to exclude (e.g., `'["bot@example.com", "dependabot", "*-bot"]'`). | No       | `[]` (empty array) |
| `organization` | Organization name to analyze (when specified, contributions will be counted across all repositories). | No     | N/A         |

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
    uses: ishakhorski/top-contributors@v2
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      output: CONTRIBUTORS.md
      limit: 10
```

### Using Markers

If you want to update only a specific section in an existing file rather than replacing the entire file, you can use markers:

```yaml
- name: Generate Top Contributors Leaderboard
  uses: ishakhorski/top-contributors@v2
  with:
  token: ${{ secrets.GITHUB_TOKEN }}
  output: README.md
  limit: 10
  marker_start: "<!-- TOP-CONTRIBUTORS-START -->"
  marker_end: "<!-- TOP-CONTRIBUTORS-END -->"
```

`README.md`:
```markdown
## 🏆 Top Contributors

<!-- TOP-CONTRIBUTORS-START -->
<!-- TOP-CONTRIBUTORS-END -->
```

This will only update the content between these markers in your README.md file, preserving the rest of the file's content.

### Excluding Contributors

You can exclude certain users from the karma calculation by providing an array of patterns:

```yaml
- name: Generate Top Contributors Leaderboard
  uses: ishakhorski/top-contributors@v2
  with:
  token: ${{ secrets.GITHUB_TOKEN }}
  output: CONTRIBUTORS.md
  exclude: '["dependabot", "*-bot", "actions-user", "noreply@github.com"]'
```

The exclude parameter supports:
- Exact GitHub usernames (e.g., "dependabot")
- Email addresses (e.g., "bot@example.com")
- Wildcard patterns (e.g., "*-bot" would match "github-bot", "dependabot-bot", etc.)

### Organization-wide Analysis

To analyze contributions across all repositories in an organization:
```yaml
- name: Generate Organization Top Contributors
  uses: ishakhorski/top-contributors@v2
  with:
  token: ${{ secrets.GITHUB_TOKEN }}
  output: ORG_CONTRIBUTORS.md
  organization: "your-organization-name"
  limit: 20
```

This will calculate karma points based on contributors' activities across all repositories in the specified organization.

## Permissions

This action requires a GitHub token with at least read access to the repository contents. For organization-wide analysis, the token needs read access to all repositories in the organization.

## License

This project is licensed under the MIT License.

## Author

Developed by Ivan Shakhorski.
