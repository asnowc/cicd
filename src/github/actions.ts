import type { Octokit } from "octokit";
import type { RestEndpointMethods } from "./type.ts";

export type ArtifactsResponse = Awaited<
  ReturnType<Octokit["rest"]["actions"]["listArtifactsForRepo"]>
>["data"];

export class Actions {
  #restApi: RestEndpointMethods;
  constructor(readonly owner: string, readonly repoName: string, restApi: RestEndpointMethods) {
    this.#restApi = restApi;
  }
  /** 获取最新的工件信息 */
  async listArtifacts(name?: string): Promise<ArtifactsResponse>;
  async listArtifacts(option?: ListArtifactsOption): Promise<ArtifactsResponse>;
  async listArtifacts(option?: string | ListArtifactsOption): Promise<ArtifactsResponse> {
    if (typeof option === "string") option = { name: option };
    const { data } = await this.#restApi.actions.listArtifactsForRepo({
      owner: this.owner,
      repo: this.repoName,
      per_page: 1,
      page: option?.page,
      name: option?.name,
      request: { signal: option?.signal },
    });

    return data;
  }
  /**
   * 下载工件
   * @param artifactId - 如果是 string 类型 则根据该名称查找并下载, 如果是number类型,则根据该ID查找
   */
  async downloadArtifact(
    artifactId: number,
    options: DownloadArtifactOption = {},
  ): Promise<DownloadArtifactResult> {
    const { owner, repoName } = this;
    const res = await this.#restApi.actions.downloadArtifact({
      artifact_id: artifactId,
      owner,
      repo: repoName,
      archive_format: options.archive_format ?? "zip",
      request: { parseSuccessResponseBody: false, signal: options.signal },
    });
    const size = res.headers["content-length"];
    const mime = res.headers["content-type"];
    const body = res.data as ReadableStream<Uint8Array>;
    return {
      body,
      size,
      mime,
    };
  }
}
export interface GitHubRequestOption {
  signal?: AbortSignal;
}
export interface DownloadArtifactOption extends GitHubRequestOption {
  archive_format?: "zip" | string;
}
export interface ListArtifactsOption extends GitHubRequestOption {
  per_page?: number;
  page?: number;
  name?: string;
}
export interface DownloadArtifactResult {
  body: ReadableStream<Uint8Array>;
  size?: number;
  mime?: string;
}
