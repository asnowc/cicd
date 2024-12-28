/**
 * @module
 * ### 使用 glob 创建归档文件
 * ```ts
 * import { createTar } from "@asn/build"
 *
 * await createTar("src/*.js","abc.tar")
 *
 * ```
 */

export * from "./build/tar/mod.ts";
