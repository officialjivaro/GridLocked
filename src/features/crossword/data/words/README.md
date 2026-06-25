# Crossword word records

Each alphabetized JSON file contains an array of records. Put a record in the file matching the first letter of its normalized answer.

Required fields:

- `id`: unique and stable string.
- `answer`: player-facing answer. Letters, spaces, apostrophes, and hyphens are supported.
- `clue`: concise clue that does not directly contain the answer.
- `topics`: one or more of `science`, `nature`, `technology`, or `general`.
- `difficulty`: integer `1`, `2`, or `3`.
- `enabled`: set to `false` to temporarily exclude a record.
- `language`: currently `en`.

After adding a file, import it in `index.js`. Run `npm run validate:words` before building.

The current collection contains 225 records: nine records in each of the 25 included alphabet files.
