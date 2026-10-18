-- schema.sql
-- Description: PostgreSQL schema definitions for users, characters, cards, game runs, and the run_cards join table with foreign key relationships.
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(500) NOT NULL,
    email VARCHAR(500) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE characters(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    title VARCHAR(500) NOT NULL,
    health INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    attack_power DOUBLE PRECISION NOT NULL,
    sprite_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE cards(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    title VARCHAR(500) NOT NULL,
    description VARCHAR(500) NOT NULL,
    effect_type VARCHAR(50) NOT NULL,
    value VARCHAR(500) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE runs(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    character_id INTEGER REFERENCES characters (id),
    score DOUBLE PRECISION NOT NULL,
    level_reached VARCHAR(50) NOT NULL ,
    completed_at TIMESTAMP NOT NULL
);
