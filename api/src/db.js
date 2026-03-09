import pg from 'pg';

const { Pool } = pg;

const {
  POSTGRES_HOST = 'postgres',
  POSTGRES_PORT = '5432',
  POSTGRES_DB = 'football',
  POSTGRES_USER = 'football',
  POSTGRES_PASSWORD = 'football',
} = process.env;

export const pool = new Pool({
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  max: 10,
});

export async function migrate() {
  // Minimal migrations (idempotent)
  await pool.query(`
    create table if not exists users (
      id uuid primary key,
      email text unique not null,
      password_hash text,
      display_name text,
      created_at timestamptz not null default now()
    );

    create table if not exists refresh_tokens (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null,
      expires_at timestamptz not null,
      revoked_at timestamptz,
      created_at timestamptz not null default now()
    );
    create index if not exists refresh_tokens_user_id_idx on refresh_tokens(user_id);

    create table if not exists favorites (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      type text not null,
      entity_id text not null,
      created_at timestamptz not null default now(),
      unique(user_id, type, entity_id)
    );
    create index if not exists favorites_user_id_idx on favorites(user_id);
  `);
}
