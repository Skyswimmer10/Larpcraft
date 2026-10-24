# FATE Character and Communication rework

Implement the two reviewed sets of changes without replacing existing wizard results or drafts.

- Give Character profile and Communication / dialogue distinct setup choices, fields and output, while retaining other purposes.
- Keep independent answers for each purpose when switching an unfinished draft. Simple and Advanced continue sharing answers within that purpose.
- Normalize older single authority selections into multiple sources. Keep specific details per selected option; deselection retains text but excludes it from current output.
- Combine authored summaries and selections in design context. Keep chosen categories visible beside the preview. Give Communication explicit spoken lines and possible listener replies rather than pretending descriptions are spoken words.
- Add speaker/listener names and optional entity links, clearer destination and context help, recurring character emotions and situation → mixed feelings → response → exception patterns.
- Allow explicit use of a saved character FATE profile as listener background, with purpose-specific follow-up guidance. Retain its snapshot when its source changes or is removed; refresh explicitly.
- Preserve manual prose edits, existing purpose scopes, legacy question keys, save/revise flows, draft persistence and library behavior.
- Verify pure logic, actual API/disk persistence, isolated browser flows including the reported gaining/spoken words/silence/secret example, old content, switching purposes, mobile and keyboard use.
