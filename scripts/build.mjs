#!/usr/bin/env node
/**
 * Renders README.md and docs/games.json from data/*.yml.
 *
 * `node scripts/build.mjs`         writes both files
 * `node scripts/build.mjs --check` exits non-zero if either is out of date
 *
 * The --check mode is what CI runs, so a pull request that edits the data but
 * forgets to rebuild fails loudly instead of silently drifting.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, loadData, slugify } from './lib/data.mjs'

const REPO_URL = 'https://github.com/guilyx/awesome-daily-minigames'
const SITE_URL = 'https://guilyx.github.io/awesome-daily-minigames/'

const check = process.argv.includes('--check')
const { categories, games, resources, byCategory } = loadData()

/**
 * GitHub's heading-anchor algorithm: lowercase, drop everything that is not a
 * letter, number, space, hyphen or underscore, then turn each remaining space
 * into a hyphen. It does not trim and it does not collapse runs, so a leading
 * emoji leaves a leading hyphen and an ampersand leaves a double hyphen —
 * "🔗 Word Association & Connections" becomes "-word-association--connections".
 */
const anchor = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')

/** Section headings carry their emoji, so anchors must be built from the same string. */
const heading = (section) => `${section.emoji} ${section.title}`

const badges = (game) => {
  const marks = []
  if (game.platform === 'reddit') marks.push('🟠')
  if (game.tags?.includes('paywalled')) marks.push('💰')
  return marks.length ? `${marks.join('')} ` : ''
}

const gameLine = (game) => `- ${badges(game)}[${game.name}](${game.url}) - ${game.description}`

// ------------------------------------------------------------------ contents
const tocLines = [...categories, ...resources].map(
  (section) => `- [${heading(section)}](#${anchor(heading(section))})`,
)

// ----------------------------------------------------------------- catalogue
const catalogue = categories
  .map((category) => {
    const entries = byCategory.get(category.id) ?? []
    return [
      `## ${heading(category)}`,
      '',
      `> ${category.blurb}`,
      '',
      ...entries.map(gameLine),
      '',
    ].join('\n')
  })
  .join('\n')

const resourceSections = resources
  .map((section) =>
    [
      `## ${heading(section)}`,
      '',
      `> ${section.blurb}`,
      '',
      ...section.items.map((item) => `- [${item.name}](${item.url}) - ${item.description}`),
      '',
    ].join('\n'),
  )
  .join('\n')

// -------------------------------------------------------------------- render
const template = readFileSync(join(ROOT, 'templates', 'README.md'), 'utf8')

const readme = template
  .replaceAll('{{GAME_COUNT}}', String(games.length))
  .replaceAll('{{CATEGORY_COUNT}}', String(categories.length))
  .replaceAll('{{REDDIT_COUNT}}', String(games.filter((game) => game.platform === 'reddit').length))
  .replaceAll('{{SITE_URL}}', SITE_URL)
  .replaceAll('{{REPO_URL}}', REPO_URL)
  .replace('{{TOC}}', tocLines.join('\n'))
  .replace('{{CATALOGUE}}', catalogue)
  .replace('{{RESOURCES}}', resourceSections)

// ----------------------------------------------------------------- site data
const siteData = {
  generated: 'run `npm run build` to regenerate — do not edit by hand',
  counts: {
    games: games.length,
    categories: categories.length,
    reddit: games.filter((game) => game.platform === 'reddit').length,
  },
  categories: categories.map(({ id, title, emoji, blurb }) => ({ id, title, emoji, blurb })),
  games: games.map((game) => ({
    id: slugify(game.name),
    name: game.name,
    url: game.url,
    category: game.category,
    platform: game.platform,
    description: game.description,
    tags: game.tags ?? [],
  })),
  resources: resources.map(({ id, title, emoji, blurb, items }) => ({ id, title, emoji, blurb, items })),
}

const outputs = [
  [join(ROOT, 'README.md'), readme],
  [join(ROOT, 'docs', 'games.json'), `${JSON.stringify(siteData, null, 2)}\n`],
]

let stale = false
for (const [path, contents] of outputs) {
  const current = (() => {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return null
    }
  })()

  if (current === contents) continue

  if (check) {
    stale = true
    console.error(`out of date: ${path.replace(`${ROOT}/`, '')}`)
  } else {
    writeFileSync(path, contents)
    console.log(`wrote ${path.replace(`${ROOT}/`, '')}`)
  }
}

if (check) {
  if (stale) {
    console.error('\nRun `npm run build` and commit the result.')
    process.exit(1)
  }
  console.log('ok  README.md and docs/games.json are up to date')
}
