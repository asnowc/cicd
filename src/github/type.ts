import type { Octokit } from "octokit";

export type RestEndpointMethods = Octokit["rest"];

export interface GitHubRequestOption {
  signal?: AbortSignal;
}
