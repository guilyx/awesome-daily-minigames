import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DATA_DIR = join(ROOT, 'data')

/** Tags a game entry is allowed to carry. Keep this list short and meaningful. */
export const ALLOWED_TAGS = [
  'nyt',
  'paywalled',
  'open-source',
  'unlimited',
  'multiplayer',
  'audio',
  'non-english',
  'classic',
]

export const PLATFORMS = {
  web: { label: 'Web', emoji: '\u{1F310}' },
  reddit: { label: 'Reddit', emoji: '\u{1F7E0}' },
}

const read = (file) => parse(readFileSync(join(DATA_DIR, file), 'utf8'))

/** Slug used for anchors, DOM ids and stable keys. */
export const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function loadData() {
  const categories = read('categories.yml')
  const games = read('games.yml')
  const resources = read('resources.yml')

  const byCategory = new Map(categories.map((category) => [category.id, []]))
  for (const game of games) {
    byCategory.get(game.category)?.push(game)
  }

  return { categories, games, resources, byCategory }
}

/**
 * Within a category the first entry is the landmark game and stays pinned to
 * the top; everything after it is alphabetical. Leading articles are ignored so
 * "The Mini Crossword" files under M.
 */
export const sortKey = (name) => name.toLowerCase().replace(/^the\s+/, '')

export const compareGames = (a, b) => sortKey(a.name).localeCompare(sortKey(b.name), 'en')
