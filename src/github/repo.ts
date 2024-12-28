import { Octokit } from "octokit";
import { Actions } from "./actions.ts";

export class GitHubRepo {
  #octokit: Octokit;
  constructor(readonly owner: string, readonly repoName: string, option: { auth?: any }) {
    this.#octokit = new Octokit({ auth: option.auth });
    const restApi = this.#octokit.rest;
    this.actions = new Actions(owner, repoName, restApi);
  }
  actions: Actions;
}

export * from "octokit";
export * from "./actions.ts";
