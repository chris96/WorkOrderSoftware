import { createAdminSupabaseClient } from "@/lib/supabase/server";

type SignedStorageObject = {
  storage_bucket: string;
  storage_path: string;
};

export async function attachSignedUrls<T extends SignedStorageObject>(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  files: T[],
  expiresInSeconds: number,
  errorMessage: string
): Promise<Array<T & { signedUrl: string | null }>> {
  if (files.length === 0) {
    return [];
  }

  const filesByBucket = new Map<
    string,
    Array<{
      file: T;
      index: number;
    }>
  >();

  files.forEach((file, index) => {
    const bucketFiles = filesByBucket.get(file.storage_bucket) ?? [];
    bucketFiles.push({ file, index });
    filesByBucket.set(file.storage_bucket, bucketFiles);
  });

  const signedUrls = new Map<string, string | null>();

  await Promise.all(
    Array.from(filesByBucket.entries()).map(async ([bucket, bucketFiles]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(
          bucketFiles.map(({ file }) => file.storage_path),
          expiresInSeconds
        );

      if (error) {
        throw new Error(errorMessage);
      }

      bucketFiles.forEach(({ file }, index) => {
        const signedUrl = data?.[index]?.signedUrl ?? null;
        signedUrls.set(`${bucket}:${file.storage_path}`, signedUrl);
      });
    })
  );

  return files.map((file) => ({
    ...file,
    signedUrl: signedUrls.get(`${file.storage_bucket}:${file.storage_path}`) ?? null,
  }));
}
