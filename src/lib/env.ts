type EnvValue = string | undefined;

function requireEnv(name: string, value: EnvValue) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readPublicSupabaseEnv() {
  return {
    url: requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    anonKey: requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

export function getSupabaseBrowserEnv() {
  return readPublicSupabaseEnv();
}

export function getSupabaseServerEnv() {
  return {
    ...readPublicSupabaseEnv(),
    serviceRoleKey: requireEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    databaseUrl: requireEnv("DATABASE_URL", process.env.DATABASE_URL),
  };
}

export function getStaffBootstrapEnv() {
  return {
    bootstrapKey: requireEnv(
      "STAFF_BOOTSTRAP_KEY",
      process.env.STAFF_BOOTSTRAP_KEY
    ),
  };
}

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

