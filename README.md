# Top Contributors Action

<img alt="GitHub Action" src="https://img.shields.io/badge/GitHub-Action-blue?logo=github"> <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-green">

A GitHub Action that generates a leaderboard of top contributors for your repository or organization based on various contribution types like pull requests, issues, reviews, commits, and comments.

## Features

- Track contributions across a single repository or an entire GitHub organization
- Configurable point values for different contribution types
- Exclude specific users or bots using patterns
- Limit the number of contributors shown
- Update an existing file using custom markers
- Automatic medal rankings (🥇, 🥈, 🥉) for top contributors

## Usage

### Basic Example

```yml
name: Update Top Contributors

on:
    schedule:
        - cron: '0 0 * * 0'  # Run weekly on Sunday at midnight
    workflow_dispatch:      # Allow manual trigger

jobs:
    update-contributors:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Generate Top Contributors
                uses: ishakhorski/top-contributors-action@v2
                with:
                    token: ${{ secrets.GITHUB_TOKEN }}

            - name: Commit and push if changed
                run: |
                    git config --local user.email "action@github.com"
                    git config --local user.name "GitHub Action"
                    git add CONTRIBUTORS.md
                    git commit -m "Update top contributors" || exit 0
                    git push
```

### Advanced Example

```yml
name: Update Top Contributors

on:
    schedule:
        - cron: '0 0 1 * *'  # Run monthly
    workflow_dispatch:      # Allow manual trigger

jobs:
    update-contributors:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Generate Top Contributors
                uses: ishakhorski/top-contributors-action@v2
                with:
                    token: ${{ secrets.GITHUB_TOKEN }}
                    organization: 'your-organization'  # Process all repos in the org
                    limit: 10                          # Show top 10 contributors
                    output: 'docs/CONTRIBUTORS.md'     # Custom output file
                    marker_start: '<!-- CONTRIBUTORS-START -->'
                    marker_end: '<!-- CONTRIBUTORS-END -->'
                    exclude: '["dependabot*", "*-bot", "bot@example.com"]'

            - name: Commit and push if changed
                run: |
                    git config --local user.email "action@github.com"
                    git config --local user.name "GitHub Action"
                    git add docs/CONTRIBUTORS.md
                    git commit -m "Update top contributors" || exit 0
                    git push
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub Token with permissions to access repositories | Yes | - |
| `organization` | Organization name to analyze across all public repositories | No | Current repository only |
| `limit` | Maximum number of contributors to display | No | No limit |
| `output` | File path to write the leaderboard to | No | `CONTRIBUTORS.md` |
| `marker_start` | Start marker for file insertion | No | Empty (overwrites file) |
| `marker_end` | End marker for file insertion | No | Empty (overwrites file) |
| `exclude` | JSON array of patterns or emails to exclude | No | `[]` |
| `config` | JSON object to configure the contribution types and their weights | No | See default values below |

## Customizing Contribution Points

You can customize the point values for different types of contributions by providing a JSON configuration:

```yml
- name: Generate Top Contributors
    uses: ishakhorski/top-contributors-action@v2
    with:
        token: ${{ secrets.GITHUB_TOKEN }}
        config: '{"pull_request": 10, "issue": 5, "review": 3, "commit": 2, "comment": 1}'
```

### Default Point Values

If no configuration is provided, the following default values are used:

- Pull request: 10 points (only merged PR's)
- Issue: 5 points
- Review: 3 points
- Commit: 2 points
- Comment: 1 point

## Output Format

The generated markdown will look like:

| 🏆 Rank | 👤 User | 🔥 Karma |
|:-------:|:--------:|:--------:|
| 🥇 | <a href="https://github.com/user1">@user1</a> | 42 |
| 🥈 | <a href="https://github.com/user2">@user2</a> | 36 |
| 🥉 | <a href="https://github.com/user3">@user3</a> | 28 |
| 4 | <a href="https://github.com/user4">@user4</a> | 15 |

_Last updated: 2023-07-15_

## Using Markers

To update a specific section of an existing file, add markers to the file:

```md
# My Project

Some content here...

<!-- CONTRIBUTORS-START -->
This content will be replaced by the action
<!-- CONTRIBUTORS-END -->

More content here...
```

Then configure the action to use these markers:
```yml
with:
    marker_start: '<!-- CONTRIBUTORS-START -->'
    marker_end: '<!-- CONTRIBUTORS-END -->'
```

## License

This project is licensed under the MIT License.
