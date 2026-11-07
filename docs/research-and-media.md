# Research, tables and character media

Implemented locally on 27 October 2026.

## Reference collection

Library → Research & References is a reusable collection across games. Create a reference, name it, add a summary, source/author credit and optional source URL. Add ordered panels for text notes, web/video links and timestamp notes, images/PDFs/files, or a table. References can be searched and filtered by panel type. Edits save automatically; deletion and edits support normal Undo.

The library's optional `research` collection stores records with `id`, `title`, `summary`, `credit`, `sourceUrl`, `createdAt` and `panels[]`. Text is authored directly. Adding a web source does not scrape or fetch its contents. Source links allow http/https and open separately with no opener access.

## Tables and statistics

A reusable table panel begins with Name, Value and Unit columns. Headings are editable; add/remove columns and rows as needed. `columns[]` stores stable IDs and labels; `rows[]` stores stable IDs and `cells` keyed by column ID. Cells remain plain authoring text. This is not a formula engine, live game scoreboard or automatically applied character statistic.

## Character gallery

The inspector and editable character profile show a compact Media & references button beside Quick attributes. Quick attributes itself is now one button, with all fields and explanatory text inside a centered window.

The optional gallery supports multiple uploaded images, video links and external file-path references. Entries have a title, caption/timing notes and credit, and can be reordered or removed. Use as portrait explicitly copies a selected image to the existing portrait slot; adding a gallery image does not otherwise change the node's portrait. Direct supported video-file URLs use native player controls; other video links open at their source. Local paths remain written references that the author opens from the external folder.

`mediaGallery[]` is optional character node data, preserved in normal node copies and library templates. `researchIds[]` links existing library references. Opening a linked reference from the editable gallery edits the same library record; unlinking does not delete it. Missing references retain their IDs and show as unavailable. The full-description viewer offers read access when media/references are present. AI context exports include media titles, captions, credits and references, without image binaries. No reference content is automatically treated as character fact or copied over protected prose or wizard answers.

## Files and backups

Images and small research attachments embed in ordinary JSON saves as `{ id, name, type, size, dataUrl }`. Each upload is limited to 8 MB; videos use links/paths rather than embedded binaries. Research attachments can be downloaded, and PDFs have an optional browser preview with a download fallback. Save-size checks reserve headroom below the local API's 100 MB request limit.

Master research remains in the library when a new game starts. Complete workspace backup transfers both the library references and the active game. Game-only backup includes that game's gallery and reference IDs, while external video/file binaries are not bundled. Transfer the complete workspace to preserve both sides of research links.

Validation covers additive migration, storage ownership, table edits, source URL restrictions, file limits, reordering/deletion/Undo, independent templates/copies, exports without binaries, full workspace backup and real local-API disk round trips in temporary directories. Disposable browser fixtures verify table editing, file/image uploads, gallery captions, video links, ordering, research links, compact buttons and modal behavior without inserting test content into the authored game.
