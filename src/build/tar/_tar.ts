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

async function getFileTarInput(relFilePath: string, rootPath: string): Promise<TarStreamInput | undefined> {
  const f = await Deno.open(path.join(rootPath, relFilePath));
  let info: Deno.FileInfo;
  try {
    info = await f.stat();
  } catch (error) {
    await f.close();
    throw error;
  }

  let tarFilename = relFilePath;
  if (path.SEPARATOR === "\\") tarFilename = tarFilename.replaceAll("\\", "/");
  const binMode = info.mode ?? 0b111_111_111;
  const mode = (binMode >> 6 & 0b111) * 100 + (binMode >> 3 & 0b111) * 10 + (binMode & 0b111);
  const option: TarStreamOptions = {
    gid: info.gid ? parseInt(info.gid.toString(8)) : 0,
    uid: info.uid ? parseInt(info.uid.toString(8)) : 0,
    mode: mode,
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
