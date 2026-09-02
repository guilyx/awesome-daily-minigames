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

2. Commit **only that file** and open the pull request. That is the whole job.

   `README.md` and `docs/games.json` are generated from `data/`, and CI rebuilds
   them on `master` after your pull request is merged. You do not need to run a
   build, and you do not need to include them in your diff — a new game should
   be a one-file change.

3. Optional, if you have Node installed and want to see your entry rendered
   before pushing:

   ```bash
   npm install     # once
   npm run check   # sorts, validates, and regenerates — exactly what CI runs
   ```

   Ordering is not your problem either: drop the entry anywhere in the file and
   CI sorts it. `npm run validate` mentions it as a warning, never an error.

   Committing the regenerated files is harmless — the workflow produces the
   same output and will simply find nothing to change.

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

`README.md` and `docs/games.json` are build artifacts, regenerated on `master`
by the [Regenerate workflow](.github/workflows/generate.yml). Editing them by
hand works right up until the next build silently reverts you — change
`data/` or `templates/README.md` instead.

## Running the site locally

```bash
npm run build
npx http-server docs -p 8080
```

The page reads `games.json` over `fetch`, so opening `docs/index.html` straight
off the filesystem will not work — it needs to be served over HTTP.

### Enabling GitHub Pages on a fork

Settings → Pages → Source: **GitHub Actions**. The
[`Deploy site`](.github/workflows/pages.yml) workflow uploads `docs/` on every
push to `master` that touches it, and you can trigger it by hand from the
Actions tab.

That workflow regenerates `docs/games.json` from `data/` before uploading, so
the deployed site is correct even when the committed copy has not caught up
yet.

## Code of conduct

Participation is covered by our [Code of Conduct](CODE_OF_CONDUCT.md).

[new-issue]: https://github.com/guilyx/awesome-daily-minigames/issues/new/choose
