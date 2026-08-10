# Contributing

Thanks for helping keep this list good. Everything here is generated from three
YAML files, so adding a game is usually a five-line change.

## What gets in

This list is **curated, not exhaustive**. A game being real is not by itself an
argument for adding it — [aukspot/dles](https://github.com/aukspot/dles) already
does the complete-directory job very well, and does it better than we would.

An entry should tick all of these:

- **It resets on a daily cadence.** Everyone gets the same puzzle on the same
  day. A handful of landmark exceptions are listed anyway — Absurdle, hello
  wordl and Puzzgrid are unavoidable parts of this genre even though they let
  you play forever — and they carry the `unlimited` tag so you know before you
  click. New entries need a genuine daily reset.
- **You can start playing for free**, without a subscription and ideally without
  an account. Games with a free daily and a paid archive are fine — tag them
  `paywalled` so people know before they click.
- **It is finishable in a sitting.** Roughly under fifteen minutes.
- **It is alive.** Still updating, still online, not a domain-squatted shell of
  a game that shut down in 2023.
- **It adds something.** A well-made variant with its own idea is welcome. The
  four hundredth reskinned Wordle with a different word list is not.

Things that get declined: ad-walled clones of games already listed, games that
require a mobile app install to play at all, anything NSFW, and link-farm
aggregators.

## Adding a game

1. Add an entry to [`data/games.yml`](data/games.yml):

   ```yaml
   - name: Waffle
     url: https://wafflegame.net/
     category: word-guessing
     platform: web
     description: A waffle-shaped grid of scrambled words that you repair in fifteen swaps or fewer.
     tags: [unlimited]
   ```

   | Field | Required | Notes |
   | --- | --- | --- |
   | `name` | yes | How the game calls itself. |
   | `url` | yes | `https://`, no tracking parameters, links straight to the game. |
   | `category` | yes | An `id` from [`data/categories.yml`](data/categories.yml). |
   | `platform` | yes | `web`, or `reddit` for games played inside a Reddit post. |
   | `description` | yes | One sentence describing the *mechanic*. Under 160 characters, ends with a period. |
   | `tags` | no | Any of `nyt`, `paywalled`, `open-source`, `unlimited`, `multiplayer`, `audio`, `non-english`, `classic`. |

2. Regenerate and check:

   ```bash
   npm install     # once
   npm run sort    # puts your entry in the right place
   npm run build   # regenerates README.md and docs/games.json
   npm run check   # what CI runs
   ```

3. Commit **all** changed files, including the regenerated `README.md` and
   `docs/games.json`. CI fails if they have drifted from the data.

Not comfortable with any of that? [Open an issue][new-issue] with the link
instead and someone will add it.

### Writing a good description

Describe how the game works, not how much you like it. The validator warns on
words like "best" and "awesome" for that reason.

> ✅ Guess the secret word; each attempt comes back ranked by semantic closeness.
>
> ❌ An amazing and addictive word game that you have to try!

British or American spelling are both fine. One sentence, no trailing "Enjoy!".

## Reporting a dead game

Daily games die quietly — the domain lapses and the link starts redirecting to a
casino. Please [open an issue][new-issue] when you spot one, or send a pull
request removing the entry. A scheduled workflow checks every link weekly and
opens an issue when something breaks, but it cannot catch a domain that still
returns `200` while no longer being the game.

## Adding a category

Categories live in [`data/categories.yml`](data/categories.yml). Only add one
when at least five games would sit in it and none of the existing categories
fit. Order in that file is the order used in the README and on the site.

## Repository layout

```
data/          the source of truth — games, categories and non-game resources
templates/     the prose around the generated catalogue in README.md
scripts/       validate, sort and build (plain Node, one dependency)
docs/          the GitHub Pages site; games.json is generated, the rest is not
README.md      generated — edit templates/README.md or data/ instead
```

`README.md` and `docs/games.json` are build artifacts. Editing them by hand
works right up until the next `npm run build` silently reverts you.

## Running the site locally

```bash
npm run build
npx http-server docs -p 8080
```

The page reads `games.json` over `fetch`, so opening `docs/index.html` straight
off the filesystem will not work — it needs to be served over HTTP.

### Enabling GitHub Pages on a fork

Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder
`/docs`. There is no build step to configure; the site is committed ready to
serve.

## Code of conduct

Participation is covered by our [Code of Conduct](CODE_OF_CONDUCT.md).

[new-issue]: https://github.com/guilyx/awesome-daily-minigames/issues/new/choose
