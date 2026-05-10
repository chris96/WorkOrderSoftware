export async function timeAsync<T>(
  label: string,
  operation: () => PromiseLike<T> | T
): Promise<T> {
  const start = performance.now();

  try {
    return await operation();
  } finally {
    const durationMs = Math.round((performance.now() - start) * 10) / 10;
    console.info("[perf]", { durationMs, label });
  }
}
