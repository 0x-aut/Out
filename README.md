# Out

## Authentication setup

Out uses Better Auth with PostgreSQL. The auth server appends `out-auth` to the path in `DATABASE_URL`, so keep the connection string pointed at the server and ending in `/` (do not include a database name).

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection URL ending in `/`.
- `BETTER_AUTH_SECRET`: a high-entropy secret of at least 32 characters.
- `BETTER_AUTH_URL`: the public origin of this Out deployment (for local development, `http://localhost:3000`).

Install dependencies with `pnpm install`, then create Better Auth's tables in the `out-auth` database:

```sh
pnpm dlx auth@latest migrate
```

The profile stores the user's bio, home base, travel style, and selected discovery interests as Better Auth user fields. Registration is at `/signup`, sign-in is at `/signin`, and the profile is at `/profile`.
