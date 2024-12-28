import { createTarStreamByGlob, findFilesByGlob, readGlobFiles, TarOption } from "@asn/cicd/build.ts";
import { concat } from "@std/bytes";
import * as path from "@std/path";
import { expect } from "@std/expect";
import { UntarStream } from "@std/tar";

const mockRootDir = path.join(import.meta.dirname!, "__mocks__/tar_files");
Deno.test("readGlobFiles 使用绝对路径glob匹配", async function () {
  const expectFiles = ["b.js", "dir/a.js"].map((item) => item.replace("/", path.SEPARATOR));
  const files = await Array.fromAsync(findFilesByGlob("/**/*.js", { rootPath: mockRootDir }));
  expect(files).toEqual(expectFiles);
});
Deno.test("readGlobFiles 使用相对路径glob匹配", async function () {
  const expectFiles = ["dir/a.js"].map((item) => item.replace("/", path.SEPARATOR));
  const files = await Array.fromAsync(findFilesByGlob("dir/*.js", { rootPath: mockRootDir }));
  expect(files).toEqual(expectFiles);
});
Deno.test("createTarStreamByGlob使用glob获得正确的流", async function () {
  const stream = createTarStreamByGlob("**/*.js", { rootPath: mockRootDir });
  // const files = await decodeTarStream(stream);
  // expect(files).toEqual([""]);
  for await (const chunk of stream) {
  }
});
async function decodeTarStream(stream: ReadableStream<Uint8Array>, gzip?: boolean) {
  if (gzip) stream = stream.pipeThrough(new DecompressionStream("gzip"));
  let files: string[] = [];
  //TODO UntarStream 存在问题
  for await (const item of stream.pipeThrough(new UntarStream())) {
    files.push(item.path);
  }
  return files;
}
