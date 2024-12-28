import { TarStream, TarStreamInput, TarStreamOptions } from "@std/tar";
import * as path from "@std/path";

/**
 * 输入文件路径，输出压缩文件内容
 * 符号链接会被转为相对路径
 * Requires `allow-read` permission
 */
export function createTarInputStream(rootPath: string): TransformStream<string, Uint8Array> {
  const transform = new TransformStream({
    async transform(filename, ctrl) {
      const res = await getFileTarInput(filename, rootPath);

      if (res) ctrl.enqueue(res);
    },
  });
  return {
    readable: transform.readable.pipeThrough(new TarStream()),
    writable: transform.writable,
  };
}

async function getFileTarInput(filename: string, rootPath: string): Promise<TarStreamInput | undefined> {
  const f = await Deno.open(path.join(rootPath, filename));
  let info: Deno.FileInfo;
  try {
    info = await f.stat();
  } catch (error) {
    await f.close();
    throw error;
  }

  let tarFilename = path.relative(rootPath, filename);
  if (path.SEPARATOR === "\\") tarFilename = tarFilename.replaceAll("\\", "/");
  const option: TarStreamOptions = {
    gid: info.gid ? info.gid : 0,
    uid: info.uid ? info.uid : 0,
    mode: info.mode ? info.mode : 700,
    mtime: Math.floor((info.mtime ?? new Date()).getTime() / 1000),
  };
  if (info.isFile || info.isSymlink) {
    return {
      type: "file",
      path: tarFilename,
      readable: f.readable,
      size: info.size,
      options: option,
    };
  } else if (info.isDirectory) {
    await f.close();
    return {
      type: "directory",
      path: tarFilename,
      options: option,
    };
  } else {
    await f.close();
  }
}
