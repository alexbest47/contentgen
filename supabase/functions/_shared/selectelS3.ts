import { DeleteObjectCommand, PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getSelectelS3Client() {
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: getRequiredEnv("SELECTEL_S3_REGION"),
    endpoint: `https://${getRequiredEnv("SELECTEL_S3_ENDPOINT")}`,
    credentials: {
      accessKeyId: getRequiredEnv("SELECTEL_S3_ACCESS_KEY"),
      secretAccessKey: getRequiredEnv("SELECTEL_S3_SECRET_KEY"),
    },
    forcePathStyle: false,
  });

  return cachedClient;
}

export function getSelectelS3Bucket() {
  return getRequiredEnv("SELECTEL_S3_BUCKET");
}

export async function uploadHtmlToSelectelS3(key: string, html: string) {
  const client = getSelectelS3Client();
  await client.send(new PutObjectCommand({
    Bucket: getSelectelS3Bucket(),
    Key: key,
    Body: html,
    ContentType: "text/html; charset=utf-8",
  }));
}

export async function deleteFromSelectelS3(key: string) {
  const client = getSelectelS3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: getSelectelS3Bucket(),
    Key: key,
  }));
}
