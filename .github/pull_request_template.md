<!--
Adding a game? Edit data/games.yml, then run:

    npm install && npm run sort && npm run build && npm run check

and commit the regenerated README.md and docs/games.json too.
-->

## What does this change?

<!-- One line. "Adds Waffle to Word Guessing" is a perfect PR description. -->

## Checklist

For new games:

- [ ] A new puzzle appears daily, and everyone gets the same one
- [ ] Free to start playing, without a subscription (tagged `paywalled` if there is a paid tier)
- [ ] Finishable in a sitting, and still actively running today
- [ ] Not already in the list, and not a near-identical clone of something listed
- [ ] The description explains the mechanic in one sentence and ends with a period

For any change to `data/`:

- [ ] `npm run check` passes locally
- [ ] The regenerated `README.md` and `docs/games.json` are included in this PR
