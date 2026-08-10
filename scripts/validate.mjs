#!/usr/bin/env node
/**
 * Schema and house-style checks for data/*.yml.
 *
 * Runs in CI on every pull request, so the review of a new entry can be about
 * whether the game is any good rather than whether the description ends with a
 * full stop.
 */
import { ALLOWED_TAGS, PLATFORMS, compareGames, loadData, sortKey } from './lib/data.mjs'

const errors = []
const warnings = []

const fail = (where, message) => errors.push(`${where}: ${message}`)
const warn = (where, message) => warnings.push(`${where}: ${message}`)

const { categories, games, resources } = loadData()

// ---------------------------------------------------------------- categories
const categoryIds = new Set()
for (const [index, category] of categories.entries()) {
  const where = `categories.yml[${index}]`
  for (const field of ['id', 'title', 'emoji', 'blurb']) {
    if (!category[field]) fail(where, `missing required field "${field}"`)
  }
  if (category.id && categoryIds.has(category.id)) fail(where, `duplicate category id "${category.id}"`)
  if (category.id && !/^[a-z0-9-]+$/.test(category.id)) fail(where, `id "${category.id}" must be lowercase kebab-case`)
  categoryIds.add(category.id)
}

// --------------------------------------------------------------------- games
const seenUrls = new Map()
const seenNames = new Map()

for (const [index, game] of games.entries()) {
  const where = `games.yml[${index}] (${game?.name ?? 'unnamed'})`

  for (const field of ['name', 'url', 'category', 'platform', 'description']) {
    if (!game[field]) fail(where, `missing required field "${field}"`)
  }
  if (!game.name || !game.url) continue

  if (!categoryIds.has(game.category)) fail(where, `unknown category "${game.category}"`)
  if (!PLATFORMS[game.platform]) {
    fail(where, `platform must be one of ${Object.keys(PLATFORMS).join(', ')}`)
  }

  if (!game.url.startsWith('https://')) fail(where, 'url must use https')
  if (/\s/.test(game.url)) fail(where, 'url must not contain whitespace')
  if (game.url.endsWith('/index.html') === false && /[?&]utm_/.test(game.url)) {
    fail(where, 'url must not carry tracking parameters')
  }

  const urlKey = game.url.replace(/\/$/, '').toLowerCase()
  if (seenUrls.has(urlKey)) fail(where, `duplicate url, already used by "${seenUrls.get(urlKey)}"`)
  seenUrls.set(urlKey, game.name)

  const nameKey = game.name.toLowerCase()
  if (seenNames.has(nameKey)) fail(where, `duplicate name "${game.name}"`)
  seenNames.set(nameKey, game.name)

  if (game.platform === 'reddit' && !/^https:\/\/www\.reddit\.com\/r\/[^/]+\/?$/.test(game.url)) {
    fail(where, 'reddit entries must link to https://www.reddit.com/r/<subreddit>/')
  }

  const description = game.description ?? ''
  if (!/^[A-Z0-9"']/.test(description)) fail(where, 'description must start with a capital letter')
  if (!description.endsWith('.')) fail(where, 'description must end with a period')
  if (description.length > 160) fail(where, `description is ${description.length} chars, keep it under 160`)
  if (/\b(best|amazing|awesome|ultimate|must-play)\b/i.test(description)) {
    warn(where, 'description reads like marketing copy — describe the mechanic instead')
  }

  for (const tag of game.tags ?? []) {
    if (!ALLOWED_TAGS.includes(tag)) {
      fail(where, `unknown tag "${tag}", allowed: ${ALLOWED_TAGS.join(', ')}`)
    }
  }
}

// Ordering: first entry of a category is pinned, the rest are alphabetical.
for (const category of categories) {
  const entries = games.filter((game) => game.category === category.id)
  if (entries.length === 0) {
    warn(`categories.yml (${category.id})`, 'category has no games')
    continue
  }
  const tail = entries.slice(1)
  const sorted = [...tail].sort(compareGames)
  for (const [index, game] of tail.entries()) {
    if (game.name !== sorted[index].name) {
      fail(
        `games.yml (${category.id})`,
        `entries after the first must be alphabetical — expected "${sorted[index].name}" where "${game.name}" is. Run \`npm run sort\`.`,
      )
      break
    }
  }
  void sortKey
}

// ----------------------------------------------------------------- resources
for (const [index, section] of resources.entries()) {
  const where = `resources.yml[${index}]`
  for (const field of ['id', 'title', 'emoji', 'blurb', 'items']) {
    if (!section[field]) fail(where, `missing required field "${field}"`)
  }
  for (const item of section.items ?? []) {
    const itemWhere = `${where} (${item.name ?? 'unnamed'})`
    for (const field of ['name', 'url', 'description']) {
      if (!item[field]) fail(itemWhere, `missing required field "${field}"`)
    }
    if (item.url && !item.url.startsWith('https://')) fail(itemWhere, 'url must use https')
    if (item.description && !item.description.endsWith('.')) fail(itemWhere, 'description must end with a period')
  }
}

// ------------------------------------------------------------------- report
for (const warning of warnings) console.warn(`warning  ${warning}`)
for (const error of errors) console.error(`error    ${error}`)

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s) found.`)
  process.exit(1)
}

console.log(
  `ok  ${games.length} games across ${categories.length} categories` +
    (warnings.length ? `, ${warnings.length} warning(s)` : ''),
)
