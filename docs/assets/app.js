/**
 * Awesome Daily Minigames — client-side catalogue.
 *
 * No dependencies and no build step: docs/games.json is generated from
 * data/*.yml by `npm run build`, and this file renders and filters it.
 * Filter state lives in the query string so any view can be linked to.
 */

const PLATFORMS = {
  web: { label: 'Web', emoji: '🌐' },
  reddit: { label: 'Reddit', emoji: '🟠' },
}

const TAG_LABELS = {
  nyt: 'NYT',
  paywalled: 'Paywalled',
  'open-source': 'Open source',
  unlimited: 'Unlimited',
  multiplayer: 'Multiplayer',
  audio: 'Audio',
  'non-english': 'Non-English',
  classic: 'Classic',
}

const $ = (selector) => document.querySelector(selector)

const els = {
  search: $('#search'),
  clearSearch: $('#clear-search'),
  random: $('#random'),
  reset: $('#reset'),
  results: $('#results'),
  resultCount: $('#result-count'),
  empty: $('#empty'),
  resources: $('#resources'),
  platformChips: $('#platform-chips'),
  tagChips: $('#tag-chips'),
  categoryChips: $('#category-chips'),
  themeToggle: $('#theme-toggle'),
  themeIcon: $('[data-theme-icon]'),
}

const state = {
  query: '',
  platform: null,
  tags: new Set(),
  categories: new Set(),
}

let data = { games: [], categories: [], resources: [], counts: {} }

/* ------------------------------------------------------------------- theme */

const THEMES = ['auto', 'light', 'dark']
const THEME_ICONS = { auto: '◐', light: '☀', dark: '☾' }

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  els.themeIcon.textContent = THEME_ICONS[theme]
  els.themeToggle.title = `Theme: ${theme}`
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* private browsing; the in-page toggle still works for this session */
  }
}

function initTheme() {
  let stored = null
  try {
    stored = localStorage.getItem('theme')
  } catch {
    /* ignore */
  }
  applyTheme(THEMES.includes(stored) ? stored : 'auto')

  els.themeToggle.addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(document.documentElement.dataset.theme) + 1) % THEMES.length]
    applyTheme(next)
  })
}

/* ------------------------------------------------------------- url <-> state */

function readUrl() {
  const params = new URLSearchParams(location.search)
  state.query = params.get('q') ?? ''
  state.platform = PLATFORMS[params.get('platform')] ? params.get('platform') : null
  state.tags = new Set((params.get('tags') ?? '').split(',').filter(Boolean))
  state.categories = new Set((params.get('category') ?? '').split(',').filter(Boolean))
  els.search.value = state.query
}

function writeUrl() {
  const params = new URLSearchParams()
  if (state.query) params.set('q', state.query)
  if (state.platform) params.set('platform', state.platform)
  if (state.tags.size) params.set('tags', [...state.tags].join(','))
  if (state.categories.size) params.set('category', [...state.categories].join(','))

  const query = params.toString()
  history.replaceState(null, '', query ? `?${query}` : location.pathname)
}

const isFiltered = () =>
  Boolean(state.query) || state.platform !== null || state.tags.size > 0 || state.categories.size > 0

/* --------------------------------------------------------------- filtering */

/** Matches when every whitespace-separated term appears somewhere in the entry. */
function matchesQuery(game, query) {
  if (!query) return true
  const haystack = `${game.name} ${game.description} ${game.category} ${game.tags.join(' ')}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

function visibleGames() {
  return data.games.filter(
    (game) =>
      matchesQuery(game, state.query) &&
      (state.platform === null || game.platform === state.platform) &&
      (state.categories.size === 0 || state.categories.has(game.category)) &&
      (state.tags.size === 0 || [...state.tags].every((tag) => game.tags.includes(tag))),
  )
}

/* ----------------------------------------------------------------- render */

function cardFor(game) {
  const card = document.createElement('article')
  card.className = `card${game.platform === 'reddit' ? ' card--reddit' : ''}`
  card.id = `game-${game.id}`

  const title = document.createElement('h3')
  title.className = 'card__title'
  const link = document.createElement('a')
  link.href = game.url
  link.textContent = game.name
  link.rel = 'noopener'
  link.target = '_blank'
  title.append(link)

  const description = document.createElement('p')
  description.className = 'card__description'
  description.textContent = game.description

  const meta = document.createElement('div')
  meta.className = 'card__meta'

  const platform = document.createElement('span')
  platform.className = `badge${game.platform === 'reddit' ? ' badge--reddit' : ''}`
  platform.textContent = PLATFORMS[game.platform].label
  meta.append(platform)

  for (const tag of game.tags) {
    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.textContent = TAG_LABELS[tag] ?? tag
    meta.append(badge)
  }

  card.append(title, description, meta)
  return card
}

function render() {
  const games = visibleGames()
  const byCategory = new Map()
  for (const game of games) {
    if (!byCategory.has(game.category)) byCategory.set(game.category, [])
    byCategory.get(game.category).push(game)
  }

  const fragment = document.createDocumentFragment()
  for (const category of data.categories) {
    const entries = byCategory.get(category.id)
    if (!entries?.length) continue

    const section = document.createElement('section')
    section.className = 'group'
    section.id = category.id

    const head = document.createElement('h2')
    head.className = 'group__head'
    head.append(`${category.emoji} ${category.title}`)
    const count = document.createElement('span')
    count.className = 'group__count'
    count.textContent = `${entries.length}`
    head.append(count)

    const blurb = document.createElement('p')
    blurb.className = 'group__blurb'
    blurb.textContent = category.blurb

    const grid = document.createElement('div')
    grid.className = 'grid'
    for (const game of entries) grid.append(cardFor(game))

    section.append(head, blurb, grid)
    fragment.append(section)
  }

  els.results.replaceChildren(fragment)
  els.empty.hidden = games.length > 0
  els.reset.hidden = !isFiltered()
  els.clearSearch.hidden = !state.query

  els.resultCount.textContent = isFiltered()
    ? `${games.length} of ${data.games.length} games`
    : `${data.games.length} games across ${data.categories.length} categories`

  updateChips()
}

/* ------------------------------------------------------------------ chips */

/**
 * Chips are built once and then refreshed in place. Replacing the buttons on
 * every render would throw away keyboard focus the moment you click one.
 */
const chips = []

function addChip(container, { label, isActive, countIf, onToggle }) {
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'chip'
  chip.append(label)

  const count = document.createElement('span')
  count.className = 'chip__count'
  chip.append(count)

  chip.addEventListener('click', () => {
    onToggle()
    commit()
  })

  container.append(chip)
  chips.push({ chip, count, isActive, countIf })
}

/**
 * A chip's count answers "how many games would I see if I clicked this?", so it
 * is computed against the state that clicking would produce.
 */
function countAfter(mutate) {
  const snapshot = { platform: state.platform, tags: state.tags, categories: state.categories }
  state.tags = new Set(snapshot.tags)
  state.categories = new Set(snapshot.categories)
  mutate()
  const total = visibleGames().length
  Object.assign(state, snapshot)
  return total
}

const toggleIn = (set, value) => (set.has(value) ? set.delete(value) : set.add(value))

function buildChips() {
  for (const [id, { label, emoji }] of Object.entries(PLATFORMS)) {
    addChip(els.platformChips, {
      label: `${emoji} ${label}`,
      isActive: () => state.platform === id,
      countIf: () => countAfter(() => (state.platform = state.platform === id ? null : id)),
      onToggle: () => (state.platform = state.platform === id ? null : id),
    })
  }

  for (const tag of [...new Set(data.games.flatMap((game) => game.tags))].sort()) {
    addChip(els.tagChips, {
      label: TAG_LABELS[tag] ?? tag,
      isActive: () => state.tags.has(tag),
      countIf: () => countAfter(() => toggleIn(state.tags, tag)),
      onToggle: () => toggleIn(state.tags, tag),
    })
  }

  for (const category of data.categories) {
    addChip(els.categoryChips, {
      label: `${category.emoji} ${category.title}`,
      isActive: () => state.categories.has(category.id),
      countIf: () => countAfter(() => toggleIn(state.categories, category.id)),
      onToggle: () => toggleIn(state.categories, category.id),
    })
  }
}

function updateChips() {
  for (const { chip, count, isActive, countIf } of chips) {
    chip.setAttribute('aria-pressed', String(isActive()))
    count.textContent = String(countIf())
  }
}

/* --------------------------------------------------------------- resources */

function renderResources() {
  els.resources.replaceChildren(
    ...data.resources.map((section) => {
      const wrapper = document.createElement('section')
      wrapper.className = 'resource'
      wrapper.id = section.id

      const title = document.createElement('h2')
      title.textContent = `${section.emoji} ${section.title}`

      const blurb = document.createElement('p')
      blurb.textContent = section.blurb

      const list = document.createElement('ul')
      for (const item of section.items) {
        const li = document.createElement('li')
        const link = document.createElement('a')
        link.href = item.url
        link.textContent = item.name
        link.rel = 'noopener'
        link.target = '_blank'
        const description = document.createElement('span')
        description.textContent = ` — ${item.description}`
        li.append(link, description)
        list.append(li)
      }

      wrapper.append(title, blurb, list)
      return wrapper
    }),
  )
}

/* ------------------------------------------------------------------ events */

function commit() {
  writeUrl()
  render()
}

function resetFilters() {
  state.query = ''
  state.platform = null
  state.tags.clear()
  state.categories.clear()
  els.search.value = ''
  commit()
  els.search.focus()
}

function rollRandom() {
  const pool = visibleGames()
  if (pool.length === 0) return
  const pick = pool[Math.floor(Math.random() * pool.length)]
  const card = document.querySelector(`#game-${CSS.escape(pick.id)}`)
  if (!card) return

  card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  card.classList.add('card--flash')
  card.querySelector('a')?.focus({ preventScroll: true })
  setTimeout(() => card.classList.remove('card--flash'), 1600)
}

function bindEvents() {
  let debounce
  els.search.addEventListener('input', (event) => {
    state.query = event.target.value.trim()
    clearTimeout(debounce)
    debounce = setTimeout(commit, 120)
  })

  els.clearSearch.addEventListener('click', resetFilters)
  els.reset.addEventListener('click', resetFilters)
  els.empty.querySelector('[data-reset]')?.addEventListener('click', resetFilters)
  els.random.addEventListener('click', rollRandom)

  document.addEventListener('keydown', (event) => {
    const typing = /^(input|textarea|select)$/i.test(event.target.tagName)
    if (event.key === '/' && !typing) {
      event.preventDefault()
      els.search.focus()
      els.search.select()
    } else if (event.key === 'Escape' && typing) {
      els.search.blur()
    } else if (event.key.toLowerCase() === 'r' && !typing && !event.metaKey && !event.ctrlKey) {
      rollRandom()
    }
  })
}

/* -------------------------------------------------------------------- boot */

async function boot() {
  initTheme()

  try {
    const response = await fetch('games.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data = await response.json()
  } catch (error) {
    els.resultCount.textContent = ''
    els.results.innerHTML =
      '<p class="empty">Could not load the catalogue. ' +
      'The full list is in the <a href="https://github.com/guilyx/awesome-daily-minigames#readme">README</a>.</p>'
    console.error(error)
    return
  }

  for (const [key, value] of Object.entries(data.counts ?? {})) {
    const node = document.querySelector(`[data-count="${key}"]`)
    if (node) node.textContent = String(value)
  }
  els.search.placeholder = `Search ${data.games.length} games…  (press / to focus)`

  readUrl()
  bindEvents()
  buildChips()
  renderResources()
  render()
}

boot()
