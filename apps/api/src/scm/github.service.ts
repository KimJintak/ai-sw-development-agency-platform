import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Octokit } from '@octokit/rest'
import { PrismaService } from '../prisma/prisma.service'

export interface RepoRef {
  owner: string
  repo: string
  [key: string]: string
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name)
  private readonly octokit: Octokit | null

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const token = config.get<string>('GITHUB_TOKEN')
    this.octokit = token ? new Octokit({ auth: token }) : null
    if (!this.octokit) {
      this.logger.warn('GITHUB_TOKEN not set — SCM features will be disabled')
    }
  }

  get isReady() {
    return this.octokit !== null
  }

  async resolveRepo(projectId: string): Promise<RepoRef> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { githubRepo: true },
    })
    if (!project) throw new NotFoundException(`Project ${projectId} not found`)
    if (!project.githubRepo) {
      throw new BadRequestException('Project has no githubRepo configured')
    }
    return this.parseRepoString(project.githubRepo)
  }

  parseRepoString(repo: string): RepoRef {
    const match = repo.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/\s]+?)(?:\.git)?$/)
    if (!match) throw new BadRequestException(`Invalid repo string: ${repo}`)
    return { owner: match[1], repo: match[2] }
  }

  private requireClient(): Octokit {
    if (!this.octokit) {
      throw new BadRequestException('GitHub integration not configured (GITHUB_TOKEN missing)')
    }
    return this.octokit
  }

  async getRepo(projectId: string) {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().repos.get(ref)
    return {
      owner: ref.owner,
      repo: ref.repo,
      defaultBranch: data.default_branch,
      private: data.private,
      htmlUrl: data.html_url,
      description: data.description,
      pushedAt: data.pushed_at,
      stargazersCount: data.stargazers_count,
      openIssuesCount: data.open_issues_count,
    }
  }

  async listBranches(projectId: string) {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().repos.listBranches({
      ...ref,
      per_page: 30,
    })
    return data.map((b) => ({
      name: b.name,
      sha: b.commit.sha.slice(0, 7),
      protected: b.protected,
    }))
  }

  async listCommits(projectId: string, branch?: string) {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().repos.listCommits({
      ...ref,
      sha: branch,
      per_page: 20,
    })
    return data.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author?.name ?? c.author?.login ?? '—',
      date: c.commit.author?.date ?? null,
      url: c.html_url,
    }))
  }

  async listPullRequests(projectId: string, state: 'open' | 'closed' | 'all' = 'open') {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().pulls.list({
      ...ref,
      state,
      per_page: 30,
      sort: 'updated',
      direction: 'desc',
    })
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      draft: pr.draft,
      user: pr.user?.login,
      head: pr.head.ref,
      base: pr.base.ref,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
      htmlUrl: pr.html_url,
    }))
  }

  async getPullRequest(projectId: string, number: number) {
    const ref = await this.resolveRepo(projectId)
    const [prRes, filesRes, reviewsRes] = await Promise.all([
      this.requireClient().pulls.get({ ...ref, pull_number: number }),
      this.requireClient().pulls.listFiles({ ...ref, pull_number: number, per_page: 50 }),
      this.requireClient().pulls.listReviews({ ...ref, pull_number: number }),
    ])
    const pr = prRes.data
    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      merged: pr.merged,
      mergeable: pr.mergeable,
      user: pr.user?.login,
      head: pr.head.ref,
      base: pr.base.ref,
      headSha: pr.head.sha,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
      additions: pr.additions,
      deletions: pr.deletions,
      files: filesRes.data.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch ?? null,
      })),
      reviews: reviewsRes.data.map((r) => ({
        user: r.user?.login,
        state: r.state,
        body: r.body,
        submittedAt: r.submitted_at,
      })),
    }
  }

  async createPullRequest(
    projectId: string,
    input: { title: string; body: string; head: string; base?: string; draft?: boolean },
  ) {
    const ref = await this.resolveRepo(projectId)
    const repoInfo = await this.requireClient().repos.get(ref)
    const base = input.base ?? repoInfo.data.default_branch
    const { data } = await this.requireClient().pulls.create({
      ...ref,
      title: input.title,
      body: input.body,
      head: input.head,
      base,
      draft: input.draft ?? false,
    })
    return {
      number: data.number,
      htmlUrl: data.html_url,
      state: data.state,
      head: data.head.ref,
      base: data.base.ref,
    }
  }

  async createReview(
    projectId: string,
    prNumber: number,
    input: { event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'; body?: string },
  ) {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().pulls.createReview({
      ...ref,
      pull_number: prNumber,
      event: input.event,
      body: input.body,
    })
    return {
      id: data.id,
      state: data.state,
      body: data.body,
      submittedAt: data.submitted_at,
    }
  }

  async mergePullRequest(projectId: string, prNumber: number) {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().pulls.merge({
      ...ref,
      pull_number: prNumber,
      merge_method: 'squash',
    })
    return { merged: data.merged, sha: data.sha, message: data.message }
  }

  /**
   * Creates a branch + single-file commit + PR.
   * Used by agents to publish generated code without needing Git CLI.
   */
  async commitAndPullRequest(
    projectId: string,
    input: {
      branch: string
      baseBranch?: string
      files: { path: string; content: string; message?: string }[]
      prTitle: string
      prBody: string
      draft?: boolean
    },
  ) {
    const ref = await this.resolveRepo(projectId)
    const client = this.requireClient()

    const repoInfo = await client.repos.get(ref)
    const base = input.baseBranch ?? repoInfo.data.default_branch

    const baseRef = await client.git.getRef({ ...ref, ref: `heads/${base}` })
    const baseSha = baseRef.data.object.sha

    try {
      await client.git.createRef({
        ...ref,
        ref: `refs/heads/${input.branch}`,
        sha: baseSha,
      })
    } catch (err) {
      if ((err as { status?: number }).status !== 422) throw err
      this.logger.warn(`Branch ${input.branch} already exists — reusing`)
    }

    let latestSha = baseSha
    for (const file of input.files) {
      const encoded = Buffer.from(file.content).toString('base64')
      let existingSha: string | undefined
      try {
        const existing = await client.repos.getContent({
          ...ref,
          path: file.path,
          ref: input.branch,
        })
        if (!Array.isArray(existing.data) && 'sha' in existing.data) {
          existingSha = existing.data.sha
        }
      } catch {
        /* new file */
      }
      const result = await client.repos.createOrUpdateFileContents({
        ...ref,
        path: file.path,
        message: file.message ?? `chore: update ${file.path}`,
        content: encoded,
        branch: input.branch,
        sha: existingSha,
      })
      if (result.data.commit.sha) latestSha = result.data.commit.sha
    }

    const pr = await this.createPullRequest(projectId, {
      title: input.prTitle,
      body: input.prBody,
      head: input.branch,
      base,
      draft: input.draft,
    })

    return { pr, branch: input.branch, commitSha: latestSha }
  }

  async getCombinedStatus(projectId: string, sha: string) {
    const ref = await this.resolveRepo(projectId)
    const { data } = await this.requireClient().repos.getCombinedStatusForRef({
      ...ref,
      ref: sha,
    })
    return {
      state: data.state,
      totalCount: data.total_count,
      statuses: data.statuses.map((s) => ({
        context: s.context,
        state: s.state,
        description: s.description,
        targetUrl: s.target_url,
      })),
    }
  }
}
