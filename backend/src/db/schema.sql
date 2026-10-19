-- schema.sql
-- Description: PostgreSQL schema definitions for users, characters, cards, game runs, and the run_cards join table with foreign key relationships.
CREATE TABLE users(
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
    value TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE runs(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    character_id INTEGER REFERENCES characters (id),
    score DOUBLE PRECISION NOT NULL,
    level_reached TEXT NOT NULL,
    completed_at TIMESTAMP NOT NULL
);
