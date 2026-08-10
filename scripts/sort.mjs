#!/usr/bin/env node
/**
 * Reorders data/games.yml into canonical order: categories in the order they
 * appear in categories.yml, and within each category the landmark entry first
 * followed by everything else alphabetically.
 *
 * Section comment banners in games.yml are regenerated, so the file keeps its
 * shape no matter where a contributor pasted their entry.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify } from 'yaml'
import { DATA_DIR, compareGames, loadData } from './lib/data.mjs'

// Keep the hand-written file header; everything from the first section banner
// onwards is regenerated.
const existing = readFileSync(join(DATA_DIR, 'games.yml'), 'utf8').split('\n')
const bannerIndex = existing.findIndex((line) => line.startsWith('# ---'))
const preamble = existing
  .slice(0, bannerIndex === -1 ? existing.length : bannerIndex)
  .join('\n')
  .replace(/\n+$/, '')

const { categories, byCategory } = loadData()

const banner = (title) => {
  const line = `# ${'-'.repeat(Math.max(4, 76 - title.length))} ${title}`
  return line
}

const chunks = categories.map((category) => {
  const entries = byCategory.get(category.id) ?? []
  const [first, ...rest] = entries
  const ordered = first ? [first, ...rest.sort(compareGames)] : []

  const body = ordered
    .map((game) =>
      stringify([game], {
        lineWidth: 0,
        defaultStringType: 'PLAIN',
        defaultKeyType: 'PLAIN',
        flowCollectionPadding: false,
      })
        // keep `tags: [a, b]` on one line, it reads better than a block list
        .replace(/tags:\n((?:\s+- .+\n?)+)/, (_, items) => {
          const list = items
            .trim()
            .split('\n')
            .map((item) => item.trim().replace(/^- /, ''))
          return `tags: [${list.join(', ')}]\n`
        })
        .trimEnd(),
    )
    .join('\n\n')

  return `${banner(category.id)}\n${body}`
})

writeFileSync(join(DATA_DIR, 'games.yml'), `${preamble}\n\n${chunks.join('\n\n')}\n`)
console.log('sorted data/games.yml')
