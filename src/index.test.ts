import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { KarmaService } from './services/karmaService'
import * as githubService from './services/githubService'
import * as generateMarkdownModule from './utils/generateMarkdown'
import * as writeMarkdownModule from './utils/writeMarkdown'
import { run } from './index'

// Mock dependencies
vi.mock('@actions/core')
vi.mock('@actions/github')
vi.mock('./services/karmaService')
vi.mock('./services/githubService')
vi.mock('./utils/generateMarkdown')
vi.mock('./utils/writeMarkdown')

describe('run function', () => {
    const mockOctokit = { mock: 'octokit' }
    const mockKarmaService = {
        processRepository: vi.fn(),
        getLeaderboard: vi.fn().mockReturnValue([
            { username: 'user1', points: 10 },
            { username: 'user2', points: 8 },
            { username: 'user3', points: 5 }
        ])
    }
    const mockMarkdown = '## Mock Markdown'

    beforeEach(() => {
        vi.resetAllMocks()
        
        // Mock GitHub context using spyOn
        vi.spyOn(github, 'context', 'get').mockReturnValue({
            repo: { owner: 'test-owner', repo: 'test-repo' }
        } as any);
        
        // Mock getInput function
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return 'mock-token'
                default: return ''
            }
        })
        
        // Mock GitHub context and getOctokit
        vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)
        
        // Mock KarmaService
        vi.mocked(KarmaService).mockImplementation(() => mockKarmaService as any)
        
        // Mock generateMarkdown and writeMarkdown
        vi.mocked(generateMarkdownModule.generateMarkdown).mockReturnValue(mockMarkdown)
        vi.mocked(writeMarkdownModule.writeMarkdown).mockImplementation(() => {})
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should process a single repository when no organization is provided', async () => {
        await run()
        
        expect(core.getInput).toHaveBeenCalledWith('token', { required: true })
        expect(github.getOctokit).toHaveBeenCalledWith('mock-token')
        expect(mockKarmaService.processRepository).toHaveBeenCalledWith(
            { owner: 'test-owner', repo: 'test-repo' }, 
            mockOctokit
        )
        expect(core.info).toHaveBeenCalledWith('Run in repository mode: test-owner/test-repo')
        expect(generateMarkdownModule.generateMarkdown).toHaveBeenCalled()
        expect(writeMarkdownModule.writeMarkdown).toHaveBeenCalledWith('CONTRIBUTORS.md', mockMarkdown)
    })

    it('should process organization repositories when organization is provided', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return 'mock-token'
                case 'organization': return 'test-org'
                default: return ''
            }
        })

        const mockRepos = [
            { name: 'repo1' },
            { name: 'repo2' }
        ]
        vi.mocked(githubService.getOrganizationRepositories).mockResolvedValue(mockRepos as any)
        
        await run()
        
        expect(githubService.getOrganizationRepositories).toHaveBeenCalledWith(
            { org: 'test-org', type: 'public' },
            mockOctokit
        )
        
        expect(mockKarmaService.processRepository).toHaveBeenCalledTimes(2)
        expect(mockKarmaService.processRepository).toHaveBeenCalledWith(
            { owner: 'test-org', repo: 'repo1' },
            mockOctokit
        )
        expect(mockKarmaService.processRepository).toHaveBeenCalledWith(
            { owner: 'test-org', repo: 'repo2' },
            mockOctokit
        )
        
        expect(core.info).toHaveBeenCalledWith('Run in organization mode: test-org')
        expect(core.info).toHaveBeenCalledWith('Found 2 repositories in organization test-org')
    })

    it('should fail if token is not provided', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return ''  // Empty token
                default: return ''
            }
        })
        
        await run()
        
        expect(core.setFailed).toHaveBeenCalledWith('Action failed: Token is required')
    })

    it('should use provided karma config when available', async () => {
        const customConfig = { pull_request: 10, issue: 8, review: 5, commit: 3, comment: 1 }
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return 'mock-token'
                case 'config': return JSON.stringify(customConfig)
                default: return ''
            }
        })
        
        await run()
        
        expect(KarmaService).toHaveBeenCalledWith(customConfig, [])
        expect(core.info).toHaveBeenCalledWith(`Karma config: ${JSON.stringify(customConfig)}`)
    })

    it('should use default karma config when none is provided', async () => {
        await run()
        
        expect(KarmaService).toHaveBeenCalledWith(
            { pull_request: 10, issue: 5, review: 3, commit: 2, comment: 1 }, 
            []
        )
        expect(core.info).toHaveBeenCalledWith('No karma config provided, using default values')
    })

    it('should handle excludes correctly', async () => {
        const excludeList = ['bot1', 'bot2']
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return 'mock-token'
                case 'exclude': return JSON.stringify(excludeList)
                default: return ''
            }
        })
        
        await run()
        
        expect(KarmaService).toHaveBeenCalledWith(expect.anything(), excludeList)
    })

    it('should limit leaderboard when limit is provided', async () => {
        // Reset mocks to make sure we have a clean slate
        vi.clearAllMocks();
        
        // Mock getInput for both token and limit
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return 'mock-token'
                case 'limit': return '2'
                default: return ''
            }
        });
        
        // Make sure the getLeaderboard method returns the expected data
        mockKarmaService.getLeaderboard.mockReturnValue([
            { username: 'user1', points: 10 },
            { username: 'user2', points: 8 },
            { username: 'user3', points: 5 }
        ]);
        
        // Make sure generateMarkdown is being mocked properly
        vi.mocked(generateMarkdownModule.generateMarkdown).mockReturnValue(mockMarkdown);
        
        await run();
        
        // First verify the leaderboard was limited correctly
        expect(mockKarmaService.getLeaderboard).toHaveBeenCalled();
        
        // Then check that generateMarkdown was called with the limited array
        expect(generateMarkdownModule.generateMarkdown).toHaveBeenCalledWith([
            { username: 'user1', points: 10 },
            { username: 'user2', points: 8 }
        ]);
        
        expect(core.info).toHaveBeenCalledWith('Leaderboard with limit: 2 entries');
    })

    it('should use markers when provided', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
            switch (name) {
                case 'token': return 'mock-token'
                case 'marker-start': return '<!-- START -->'
                case 'marker-end': return '<!-- END -->'
                default: return ''
            }
        })
        
        await run()
        
        expect(writeMarkdownModule.writeMarkdown).toHaveBeenCalledWith(
            'CONTRIBUTORS.md', 
            mockMarkdown,
            { marker_start: '<!-- START -->', marker_end: '<!-- END -->' }
        )
        expect(core.info).toHaveBeenCalledWith('Using custom markers: <!-- START --> and <!-- END -->. This will overwrite the file content between these markers.')
    })
})