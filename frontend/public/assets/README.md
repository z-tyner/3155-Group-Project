# Game Art Assets

This directory contains static assets for the 2D turn-based game. Because files in `public/` are served at root, any asset here can be loaded in the canvas engine or database records via absolute URLs starting with `/assets/...`.

## Directory Overview

* **`characters/`**: Playable character sprites.
  * `idle/`: Default standing poses or idle animation frames/spritesheets.
  * `attack/`: Attack motion frames or action spritesheets.
  * `hurt/`: Damage reaction or fainting frames.
* **`enemies/`**: Enemy mob and boss sprites.
  * `idle/`: Default battle stance frames.
  * `attack/`: Attack motion frames.
  * `hurt/`: Hit/damaged frames.
* **`cards/`**: Power-up and ability card artwork (used by `CardItem` and the drafting system).
  * `art/`: Illustrations for card effects (attack, defense, heal, buffs).
  * `frames/`: Card borders, rarity backgrounds, or card templates.
* **`effects/`**: Visual effect animations triggered during turn actions.
  * `hits/`: Impact sparks, slashes, and strike effects.
  * `projectiles/`: Spells, arrows, or ranged projectiles.
  * `status/`: Buff/debuff indicators (shields, poison, stun, stat up/down).
* **`backgrounds/`**: Static arena/stage backdrops (dungeons, arenas, fields) rendered behind combatants.
* **`ui/`**: In-game HUD elements.
  * `icons/`: Stat icons (HP heart, speed boot, sword/attack, shield).
  * `buttons/`: Turn controls (e.g. End Turn, Action triggers).

## Usage in Code & Database

* **In Canvas Engine (`Renderer.ts`)**:
  ```ts
  const sprite = new Image();
  sprite.src = '/assets/characters/idle/warrior.png';
  ```
* **In Database records (`sprite_url` / `image_url`)**:
  ```sql
  INSERT INTO characters (title, sprite_url, ...) VALUES ('Knight', '/assets/characters/idle/knight.png', ...);
  INSERT INTO cards (title, image_url, ...) VALUES ('Fire Slash', '/assets/cards/art/fire_slash.png', ...);
  ```
