import { createTarInputStream } from "./_tar.ts";
import { Glob } from "glob";

export type TarOption = {
  /** 默认为工作目录 */
  rootPath?: string;
  gzip?: boolean;
  /** filename 相对于 rootPath */
  filter?: (filename: string) => string | false;
};
/**
 * 输入 glob表达式 创建归档文件流
 * @param filesGlob 一个或多个 glob 表达式。
 */
export function createTarStreamByGlob(
  filesGlob: string | string[],
  option: TarOption = {},
): ReadableStream<Uint8Array> {
  const { rootPath = Deno.cwd(), gzip, filter } = option;
  const glob = findFilesByGlob(filesGlob, { rootPath });
  let stream = ReadableStream.from(filter ? filterFiles(glob, filter) : glob)
    .pipeThrough(createTarInputStream(rootPath));
  if (gzip) stream = stream.pipeThrough(new CompressionStream("gzip"));
  return stream;
}
async function* filterFiles(iter: AsyncGenerator<string>, filter: (filename: string) => string | false) {
  for await (const file of iter) {
    let filename = filter(file);
    if (filename && typeof filename === "string") yield filename;
  }
}
/** 扫描文件，返回的文件是相对于 rootPath */
export async function* findFilesByGlob(
  glob: string[] | string,
  options: { rootPath?: string } = {},
): AsyncGenerator<string> {
  const matcher = new Glob(glob, {
    root: options.rootPath,
    cwd: options.rootPath,
    absolute: false,
    dot: true,
  });
  yield* matcher;
}

/**
 * 读取 glob 文件
 * Requires `allow-read` permission
 * ```
 * src/*.js
 *
 * src/*.ts
 * ```
 */
export async function readGlobFiles(pathname: string): Promise<string[]> {
  const data = await Deno.readTextFile(pathname);
  const list = data.split(/\r?\n/);
  const globs: string[] = [];
  for (let item of list) {
    item = item.trim();
    if (item) globs.push(item);
  }
  return globs;
}
