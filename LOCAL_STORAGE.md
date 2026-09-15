# Local workspace storage

Run `npm run dev` and open http://localhost:5173/ or http://127.0.0.1:5173/.
Both addresses and all browsers use the same disk files through the local Vite
server. Reload pre-existing browser tabs once to adopt the new save system.

## Files

- `.larpcraft/library.json`: shared master library, including embedded original images.
- `.larpcraft/project.json`: active game.
- `.larpcraft/*.previous.json`: preceding committed versions.
- `.larpcraft/browser-backups/`: content-addressed browser snapshots and rejected drafts.
- `.larpcraft/assets/`: extracted original images from the initial recovery.
- `.larpcraft/image-inventory.json`: original browser paths mapped to extracted files.

New and edited images are saved inside `library.json` or `project.json` along with
their records. The extracted asset folder is the initial recovery inventory,
not an independently maintained live asset store. Back up the entire `.larpcraft`
folder to preserve local work. It is gitignored; deployment/export is a separate step.

## Saving and conflicts

Local development loads the disk files first, after archiving the browser's
existing IndexedDB/localStorage data. Browser storage remains a recovery copy.
Edits commit after a short debounce. The title bar confirms **Saved to local files**
only after the server acknowledges the saves. Pending disk saves trigger the
browser's leave-page prompt. Files are written through a temporary file, flushed,
and renamed; the preceding version is retained.

An old tab cannot overwrite a newer saved revision. On conflict, the title bar
shows **Local save needs attention** and preserves the draft in browser storage
and, if reachable, in `browser-backups`. Export the draft through File before
reconciling it with the shared file. Work in one editing tab at a time; reload
another browser before continuing there. This is shared persistence, not live
collaborative editing.

## Initial recovery (2026-09-15)

Fresh Brave and Codex snapshots were captured under:
`C:/Users/Didzis/Gmy Documents/ALL/game/Larpcraft-browser-backups/2026-09-15/disk-migration/`.
All 176 Brave mechanism records were imported, with 44 concepts retained.
All 176 mechanism image objects were verified identical after app migration.
176 distinct image files across both recovered workspaces were extracted.
The current Codex game remained active; the differing Brave game is preserved
in the original `local-workspace.json` backup.

## Hosting

The disk API is a local-development service restricted to local same-origin
requests. GitHub and Vercel were not updated. Production builds still use browser
storage until a hosted persistence service or explicit publication workflow is
implemented. A running local server is required for disk autosave.

## Published snapshot — 15 September 2026

The deployed library includes 44 concepts and all 176 recovered mechanism image entries (175 unique image files). Original image bytes are published under `public/library-images/`; deployed JSON references those assets rather than embedding large base64 strings. Local canonical JSON and recovery archives remain unchanged and excluded from Git and deployment uploads.

Library bundle version 5 and project bundle version 2 publish the current local snapshot. Existing hosted browser edits retain the existing merge protections. Hosted edits still save in that browser; local Vite sessions save in `.larpcraft/`.
