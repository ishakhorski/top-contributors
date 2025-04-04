import type { GitHubService } from "./github.js";

interface KarmaConfig {
  comment?: number;
  commit?: number;
  issue?: number;
  review?: number;
  pull_request?: number;
}

class KarmaService {
  #githubService: GitHubService;
  #karmaConfig: KarmaConfig;
  #excludeConfig: RegExp[];
  #karma: Map<string, number>;

  constructor(
    githubService: GitHubService,
    config: KarmaConfig,
    exclude: string[]
  ) {
    this.#githubService = githubService;
    this.#karmaConfig = config;
    this.#excludeConfig = exclude.map((pattern) => {
      const regexPattern = pattern
        .replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${regexPattern}$`, "i");
    });
    this.#karma = new Map();
  }

  #isExcluded(username: string, email: string): boolean {
    if (!this.#excludeConfig.length) {
      return false;
    }

    if (!username && !email) {
      return true;
    }

    return this.#excludeConfig.some((regex) => {
      return [username, email].some((value) => value && regex.test(value));
    });
  }

  #addKarma(username: string, value: number): void {
    const currentKarma = this.#karma.get(username) || 0;
    this.#karma.set(username, currentKarma + value);
  }

  async calculateRepoKarma(options: { owner: string; repo: string }) {
    const { owner, repo } = options;

    try {
    } catch (error) {
      throw new Error(`Failed to calculate karma: ${error}`);
    }
  }
}

export default KarmaService;
export type { KarmaService };
