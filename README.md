# Out

## Environment

Out uses one PostgreSQL server URL and two separate databases:

- \`out-auth\` stores Better Auth users, sessions, and authentication data.
- \`out-data\` stores application profiles, interests, places, walks, and saved items.

Set \`DATABASE_URL\` to the PostgreSQL server URL with no database name (it should end in \`/\`). The server code selects the database name. Do not point it at either database directly.

Required environment variables:

- \`DATABASE_URL\`: PostgreSQL connection URL ending in \`/\`.
- \`BETTER_AUTH_SECRET\`: a high-entropy secret of at least 32 characters.
- \`BETTER_AUTH_URL\`: the public origin of this Out deployment (for local development, \`http://localhost:3000\`).
- \`QLOO_API_KEY\`: server-side Qloo API key. It is never exposed to the browser.
- \`MAPBOX_API_KEY\`: server-side Mapbox secret token with \`directions:read\` permission. It is used only by the walking-directions endpoint and is never exposed to the browser.
- \`NUXT_PUBLIC_MAPBOX_TOKEN\`: Mapbox public \`pk.\` token used by Mapbox GL JS in the browser. Restrict its allowed URLs in the Mapbox dashboard. For convenience, a \`MAPBOX_API_KEY\` that starts with \`pk.\` is also accepted as the public token, but secret \`sk.\` tokens are never exposed.
- \`QLOO_BASE_URL\` (optional): API origin for the environment that issued your Qloo key. Defaults to \`https://hackathon.api.qloo.com\` for the Qloo hackathon API. Set it to \`https://api.qloo.com\` when using a standard production API key.

## Database setup

Install dependencies with \`pnpm install\`.

Create Better Auth's tables in \`out-auth\` using the Better Auth CLI:

\`\`\`sh
pnpm dlx auth@latest migrate
\`\`\`

Create the application tables in \`out-data\` using the versioned SQL migration runner:

\`\`\`sh
pnpm db:migrate
\`\`\`

The migration runner is safe to execute more than once. It acquires a PostgreSQL advisory lock, records applied migrations and checks their checksums. It fails rather than silently accepting edits to an already-applied migration. The \`out-data\` database must already exist.

## Application data API

All application data routes require a valid Better Auth session. User-owned records are scoped to the authenticated user on the server; the API never accepts a user ID from the request body.

- \`GET /api/profile\`: read the current user's profile and categorized interests.
- \`GET /api/recommendations\`: resolve saved interests to Qloo place tags, request taste-ranked places near the saved home base, and persist normalized provider places in the shared catalog.
- \`PUT /api/profile\`: atomically save profile fields and replace the user's interest selection. Body: \`{ profile: { bio, homeBase, travelStyle }, interests: [{ name, category }] }\`. Categories are \`places\`, \`vibes\`, and \`activities\`.
- \`GET /api/places?q=&limit=&offset=\`: search the shared place catalog.
- \`POST /api/places\`: add or refresh a place. A supplied \`source\` + \`sourceId\` identifies a provider record; an existing record created by another user is returned unchanged.
- \`GET /api/places/:id\`: read a place.
- \`GET /api/walks?q=&limit=&offset=\`: list the current user's walks and public walks.
- \`POST /api/walks\`: create a walk and its ordered stops in one transaction.
- \`GET /api/walks/:id\`: read an owned or public walk with its stops.
- \`PUT /api/walks/:id\`: replace an owned walk and its stops in one transaction.
- \`DELETE /api/walks/:id\`: delete an owned walk.
- \`GET /api/saved-items\`: list the current user's saved places and walks.
- \`POST /api/saved-items\`: save a place or walk using \`{ itemType, itemId }\`.
- \`DELETE /api/saved-items/:id\`: remove one of the current user's saved items.
- \`POST /api/mapbox/directions\`: return a Mapbox walking route for 2–25 ordered coordinates. The endpoint requires authentication and uses \`MAPBOX_API_KEY\` on the server.

Places are shared catalog records. Walks, profiles, interests and saved items are user-scoped. Walk visibility defaults to private.

## Map and walking routes

The map page uses Mapbox GL JS in a Vue component. The component creates the map after mounting and removes it before unmounting, and Mapbox's \`GeolocateControl\` requests the browser's current location only after the user taps the location control. Browser geolocation requires HTTPS (localhost is allowed by browsers for local development) and the user must grant permission.

Map rendering needs a public Mapbox token (\`pk.\`) in \`NUXT_PUBLIC_MAPBOX_TOKEN\`. Walking directions use the server-only \`MAPBOX_API_KEY\` secret token with the \`directions:read\` scope. Do not put an \`sk.\` token in a \`NUXT_PUBLIC_*\` variable. The map displays Qloo recommendations that include valid coordinates; users can select up to 24 stops, calculate a walking route from their current location, and save the walk to their account.

## Qloo discovery

The recommendations route uses Qloo's \`GET /v2/tags\` lookup with \`filter.query\` to resolve profile interest labels to valid place-compatible tag IDs. It resolves the saved home base through \`GET /search?types=urn:entity:locality\`, then calls \`GET /v2/insights/\` with \`filter.type=urn:entity:place\`, \`signal.interests.tags\` for taste ranking, and the returned locality UUID in \`filter.location\`. This uses the documented Place parameter instead of relying on \`filter.location.query\`, which is not listed for Place. Tag and locality lookups are cached for six hours and recommendation results for five minutes in server memory. The Qloo key is sent only in the server-side \`X-Api-Key\` header.
