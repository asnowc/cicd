import type { Octokit } from "octokit";
import type { GitHubRequestOption, RestEndpointMethods } from "./type.ts";
import { GitHubRepo } from "@asn/cicd/github.ts";

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
      per_page: 1,
      page: option?.page,
      name: option?.name,

      request: { signal: option?.signal },
      owner: this.owner,
      repo: this.repoName,
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

export interface DownloadArtifactToParam extends DownloadArtifactOption {
  owner: string;
  repo: string;
  artifactId: number;
  auth?: any;

  /** 下载文件到的位置 */
  target: string;
  /** 默认不会覆盖文件，如果为 true，则覆盖， */
  overwrite?: boolean;

  tip?: boolean;
}
/** 下载工件到指定位置 */
export async function downloadArtifactTo(param: DownloadArtifactToParam) {
  const { target, tip, overwrite } = param;
  const actions = new GitHubRepo(param.owner, param.repo, { auth: param.auth }).actions;
  if (tip) console.log("开始下载");
  const { body, size } = await actions.downloadArtifact(param.artifactId, param);
  if (tip) console.log("size: ", size);
  let stream = body;
  if (tip) {
    let last = Date.now();
    let current = 0;
    stream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, ctrl) {
          ctrl.enqueue(chunk);
          current += chunk.byteLength;
          if (Date.now() - last > 5 * 1000) {
            const present = size ? ((current / size) * 100).toFixed(2) + "%" : "--%";
            console.log((current / 1024).toFixed(2) + "KB", present);
            last = Date.now();
          }
        },
      }),
    );
  }
  await Deno.writeFile(target, stream, { create: true, createNew: !overwrite });
  if (tip) console.log("下载完成");
}
