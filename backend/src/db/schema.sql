-- schema.sql
CREATE TABLE users(
-- Description: PostgreSQL schema definitions for users, characters, cards, game runs, and the run_cards join table with foreign key relationships.
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE characters(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    title TEXT NOT NULL,
    hp INTEGER NOT NULL,
    attack DOUBLE PRECISION NOT NULL,
    defense DOUBLE PRECISION NOT NULL DEFAULT 0,
    crit_chance DOUBLE PRECISION NOT NULL DEFAULT 0,
    armor_piercing BOOLEAN NOT NULL DEFAULT false,
    is_preset BOOLEAN NOT NULL DEFAULT false,
    sprite_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE cards(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE runs(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    character_id INTEGER REFERENCES characters (id),
    score DOUBLE PRECISION NOT NULL,
    level_reached INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);

CREATE TABLE run_cards(
    run_id INTEGER NOT NULL REFERENCES runs (id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards (id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (run_id, card_id)
);
