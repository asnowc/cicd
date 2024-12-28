/**
 * 执行命令，并返回 stdout。如果 code 不为 0，则抛出异常.
 */
export async function exec(cmd: string, opts?: Deno.CommandOptions): Promise<ExecResult> {
  const command = new Deno.Command(cmd, opts);
  const res = await command.output();
  if (!res.success) {
    throw new Error(`Command ${cmd} exit with ${res.code}`, { cause: textDecoder.decode(res.stderr) });
  }
  return new ExecResult(res);
}
export class ExecResult {
  #stdout: Uint8Array;
  #stderr: Uint8Array;
  readonly exitCode: number;
  getStdoutText(): string {
    return textDecoder.decode(this.#stdout);
  }
  getStderrText(): string {
    return textDecoder.decode(this.#stderr);
  }
  constructor(output: Deno.CommandOutput) {
    this.#stderr = output.stderr;
    this.#stdout = output.stdout;
    this.exitCode = output.code;
  }
}
const textDecoder = new TextDecoder();
