# Group and institution development

Create a **Group / Institution** node on the Narrative canvas, or choose **Group Foundations** in the Story Wizard. One node type covers families, adventuring parties, bands, guilds, factions and institutions. Existing project data is preserved.

Group Foundations is now a **framework** in both the Story Wizard and Library framework catalogue, with the green framework treatment, its shared people symbol and an Information reference view. The same framework opens the specialized group-creation wizard. Older concept-classified foundation sessions resume as frameworks using their original session IDs, answers and question trees; no authored library record is deleted or reset.

The inspector keeps four brief facts: group name, kind, approximate size and shared purpose. Kind accepts custom wording. Approximate size can describe hundreds of members without creating individual character profiles.

Add/change/remove image appears above the group name. Adding an image expands a short node enough to show it. The canvas card shows the whole image on the left, centered above Description, and accepted framework/concept symbols alongside. The previous paragraph and generic clipped thumbnail are absent. Description opens the same large centered reading layout as a character, with image, filled group facts and named framework/concept buttons in its sidebar. Those buttons reopen the exact saved input for editing, including in nested graphs.

## Group Foundations

The full-screen wizard has colored steps for Start, Identity & bonds, Members & roles, Power & rules, Tensions & change, an optional Institution step, and Description. Its right pane updates the group description while answers change. Only the name is required to save.

Questions cover origins, bonds, authority, decision-making, expectations, disagreement, existing tensions, possible pressures and possible developments. Institution details add mandate, leadership succession, resources/territory/privileges and continuing obligations. Turning institution details off retains their answers but leaves them out of the description.

This is a Larpcraft synthesis informed by the supplied Group Dynamics Atlas, not an implementation of a named research model. It does not require fixed group stages or infer behavior from membership. Possible pressures and developments remain explicitly conditional. Description formatting uses recorded choices and text; it calls no external AI service.

Drafts are stored separately from saved profiles and restored for the same target and graph scope. The small Drafts button explains this and offers an explicit reload of saved answers. Closing the wizard keeps its draft; saving applies the profile as a normal undoable graph change.

## Members and relationships

Members can link to existing character or group profiles anywhere in the project's supported graph collections, or contain names without profiles. Role and loyalty belong to the membership, so the same person can hold different roles in different groups. Other group relationships use short labels such as Allied with, Rival of and Part of; custom labels are allowed.

Linked names follow renamed profiles. Missing profiles retain the last recorded name; removing a member does not delete the original profile. Name-only members do not create placeholder characters automatically. Approximate size and the list of named members are independent.

Double-click a group to open its inner canvas. A Members & relationships card shows the roster and opens the member editor; linked-member buttons select the original profile. Each saved framework or concept gets its own editable input card and filled native question tree. Reopening Group Foundations edits the same session. Saved answers update its tree and description while preserving canvas layout and authored additions.

## Descriptions, sources and copies

Groups can accept multiple optional framework/concept inputs through the existing Story Wizard or linked canvas inputs. Each compact source card shows its symbol/name, inclusion checkbox, Edit wizard and red trash button. Exclusion preserves the answers and hides the contribution; deletion removes that input's questions, owned prose, generated input tree and matching unfinished draft. Native group facts, members, image, unrelated inputs and independent writing stay. Undo restores a deletion in one step, including its draft. A linked source is not deleted from its original canvas.

Edit Group’s Profile opens the large centered writing window with Group profile, Saved questions and Earlier writing. Profile includes full description, short introduction and AI story-context formats plus copy/download controls. Saved questions use framework/concept symbol buttons before showing editable complete prompts. There is no duplicate Export tab or character-only voice, gender, race or age UI.

Paragraph protection matches the character profile: untouched paragraphs follow changed answers, added paragraphs remain, and rewritten/deleted source paragraphs get individual keep/replace/edit review choices. Direct prose never rewrites answers. Ambiguous merges/splits remain authored writing. Copy and download use approved profile text; source questions and answers are optional and retain their source labels.

Save group to library creates an independent template with editable answers and source trees. External membership references become name-only entries in standalone templates. Clipboard copies remap linked profiles included in the same copied scope and detach external targets. Nested graph scope prevents identical node IDs in different canvases from resolving to the wrong profile.

## Implementation and verification

`groupFacts` stores compact facts, typed membership references, roles, loyalties and group relationships. Groups reuse the existing `characterProfile`, `characterCanvas` and saved wizard session machinery internally. Generated roster nodes are views of canonical membership data, rather than duplicate member profiles. Reducer reconciliation updates sources, references and descriptions within the same graph transaction.

Tests cover framework catalogue classification, older concept-session compatibility, filled trees and saved layouts, scoped links, inclusion/deletion/Undo, protected paragraphs, shared image/description presentation, grouped saved questions, independent templates and actual local-middleware save/reopen in a temporary directory. They do not write to authored local data. Local HTTP/Vite transform checks are separate from interactive visual verification, which remains unavailable because the browser tool blocks the local URL.
