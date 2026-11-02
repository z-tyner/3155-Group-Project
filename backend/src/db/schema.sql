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
    health INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    attack_power DOUBLE PRECISION NOT NULL,
    sprite_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
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
