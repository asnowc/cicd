import type { Octokit } from "octokit";
import type { RestEndpointMethods } from "./type.ts";

export type ArtifactsResponse = Awaited<
  ReturnType<Octokit["rest"]["actions"]["listArtifactsForRepo"]>
>["data"]["artifacts"][0];

export class Actions {
  #restApi: RestEndpointMethods;
  constructor(readonly owner: string, readonly repoName: string, restApi: RestEndpointMethods) {
    this.#restApi = restApi;
  }
  /** 获取最新的工件信息 */
  async listArtifacts(name?: string): Promise<ArtifactsResponse | null>;
  async listArtifacts(option?: { name?: string; signal?: AbortSignal }): Promise<ArtifactsResponse | null>;
  async listArtifacts(
    option?: string | { name?: string; signal?: AbortSignal },
  ): Promise<ArtifactsResponse | null> {
    if (typeof option === "string") option = { name: option };
    const { data } = await this.#restApi.actions.listArtifactsForRepo({
      owner: this.owner,
      repo: this.repoName,
      per_page: 1,
      name: option?.name,
      request: { signal: option?.signal },
    });
    return data.artifacts[0] ?? null;
  }
  /**
   * 下载工件
   * @param artifactId - 如果是 string 类型 则根据该名称查找并下载, 如果是number类型,则根据该ID查找
   */
  async downloadArtifact(
    artifactId: number,
    options: { signal?: AbortSignal } = {},
  ): Promise<DownloadArtifactResult> {
    const { owner, repoName } = this;
    const res = await this.#restApi.actions.downloadArtifact({
      artifact_id: artifactId,
      owner,
      repo: repoName,
      archive_format: "zip",
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
export interface DownloadArtifactResult {
  body: ReadableStream<Uint8Array>;
  size?: number;
  mime?: string;
}
