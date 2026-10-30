-- Application data is stored separately from Better Auth in the out-data database.
-- user_id values refer to Better Auth users in out-auth; cross-database foreign keys are not possible.

CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  bio TEXT NOT NULL DEFAULT '',
  home_base TEXT NOT NULL DEFAULT '',
  travel_style TEXT NOT NULL DEFAULT 'Curious wanderer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('places', 'vibes', 'activities')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX user_interests_unique_name
  ON user_interests (user_id, category, LOWER(name));

CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CHECK ((latitude IS NULL) = (longitude IS NULL))
);

CREATE UNIQUE INDEX places_source_external_id_unique
  ON places (source, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX places_name_search_idx ON places (LOWER(name));
CREATE INDEX places_city_idx ON places (LOWER(city));

CREATE TABLE walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  distance_meters INTEGER,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 1440),
  CHECK (distance_meters IS NULL OR distance_meters BETWEEN 1 AND 2000000)
);

CREATE INDEX walks_owner_created_idx ON walks (user_id, created_at DESC);
CREATE INDEX walks_public_created_idx ON walks (created_at DESC) WHERE visibility = 'public';

CREATE TABLE walk_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  duration_minutes INTEGER,
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 1440),
  UNIQUE (walk_id, position)
);

CREATE INDEX walk_stops_walk_order_idx ON walk_stops (walk_id, position);

CREATE TABLE saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('place', 'walk')),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  walk_id UUID REFERENCES walks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (item_type = 'place' AND place_id IS NOT NULL AND walk_id IS NULL)
    OR
    (item_type = 'walk' AND walk_id IS NOT NULL AND place_id IS NULL)
  )
);

CREATE UNIQUE INDEX saved_places_unique ON saved_items (user_id, place_id) WHERE item_type = 'place';
CREATE UNIQUE INDEX saved_walks_unique ON saved_items (user_id, walk_id) WHERE item_type = 'walk';
CREATE INDEX saved_items_owner_created_idx ON saved_items (user_id, created_at DESC);
