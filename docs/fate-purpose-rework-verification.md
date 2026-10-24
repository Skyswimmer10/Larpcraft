# Verification: distinct FATE purposes and specific selection details

**Story:** A designer creates a character profile or a conversation, records concrete details behind selected ideas, retains those choices while writing, and saves the resulting editable character prose or authored dialogue.

## Evidence

- Isolated browser flow reproduced the user's example: gaining something, spoken words and silence; adding the main description retained both selections and their specific text in the preview's design context.
- Multiple authority sources (secret and evidence) retained independent details. Belonging and relationship details also survived draft reload.
- Switching between Character and Communication restored separate titles, context, choices, pattern details and names. Simple/Advanced retained the current purpose's answers.
- A saved Mira profile supplied explicit listener background and relevant follow-up guidance without replacing the conversation's authority choices. Source snapshots remain unchanged until refreshed.
- Spoken dialogue used only authored words and a possible listener reply; notes about the pause remained in design notes. The edited conversation saved to game/library and updated the same node on continuation.
- Character controls supported named groups and multiple recurring emotions. Emotional patterns captured situation, mixed feelings, usual response and exception.
- Long older character answers, unrelated questions and nested notes survived migration/revision. Mobile layout, keyboard navigation, undo/redo and locks passed without runtime errors. Desktop/mobile screenshots were inspected.
- The actual local API/disk test preserved inactive purpose banks, speaker/listener names, multiple authority sources, specific details and spoken lines through startup migration.

## Final checks

- Full suite: **407 tests passed across 57 files**.
- Production build: **passed**, 165 modules transformed. Existing large-bundle warning remains.
- `git diff --check`: **passed**, with existing line-ending notices.

The browser used intercepted in-memory API copies; disk tests used guarded unique temporary directories. Canonical project/library content was not rewritten by verification. No dependencies or external generation services were added.

Manual output edits remain intentional overrides. Existing edited output changes only when the writer rebuilds from answers or edits the result directly.
