# Larpcraft project briefing for AI ideation

Last reviewed 27 October 2026

## Project purpose

Larpcraft is a developing application for designing and managing live action role playing games. It connects narrative design, gameplay mechanics, physical locations, props, sensors, players, and teams. The owner wants to create complex, nuanced games through an interface that stays clear, intuitive, and useful.

## Current design baseline

The application uses node canvases and inspectors. Narrative content includes characters, groups and institutions, story locations, story items, Story Beats, and conversations. Concepts and reference frameworks help develop this content. Reusable story tools and created content have distinct library browsing roles.

Character development can combine several editable frameworks or concepts. Compact source cards provide enable, edit, and delete controls. Character images, profile views, and source symbols connect the visual overview to deeper editing. Conversations are intended to remain accessible through the participants as well as narrative browsing.

The recently refined Dragon and the City workshop is the main design benchmark. It groups questions into City, Dragon, Responses, People and stakes, and Review. Escape, Defend, and Attack can be compared side by side, with distinct colors and faint illustrations. A live description highlights the information being edited. Long answers expand inside scrolling panes. Question and native node views share the saved answers while retaining node layouts and custom writing.

Physical location views include room schematics and an OpenStreetMap layer, with manually placed markers and lines. Sensors and player assignments are represented in the project. Live device ingestion, automatic scoring, and AI generation remain future work; existing sensor records do not establish that hardware is connected.

## Design priorities

- Show important choices openly, with meaningful labels, icons, and colors.
- Use side by side layouts and live previews when they improve understanding. Keep screen changes and duplicated controls to a minimum.
- Provide a simple core with optional depth. Do not require every character or location to answer every possible question.
- Preserve nuance, editable source answers, custom writing, local data, and existing work.
- Keep generated descriptions and node trees coherent. Offer richer node development when it is useful.
- Value elegance: an item, mechanic, or narrative element may serve several meaningful purposes.

## Prompt to use with another chatbot

Read this briefing and help me ideate about Larpcraft. My chosen topic is INSERT TOPIC HERE. First summarize the relevant needs. Suggest three practical approaches and identify existing software, frameworks, or primary sources worth studying. Explain specific interface patterns and tradeoffs, including which fields could be kept, removed, combined, or made optional. Recommend the smallest useful first version and a way to test it. Distinguish the current baseline from future ideas. Do not assume proposed features already work. Do not write code or change the project unless I explicitly request implementation. Ask only for information that materially changes your recommendation.

<!-- page -->

## Concepts and character frameworks

### 1 Upgrade all concept wizards

- [ ] Use Dragon and the City as the quality benchmark: intuitive choices, meaningful colors and illustrations, fewer screens, and readable layouts.

- [ ] Generate coherent descriptions and meaningful node trees. Keep question and node views editable representations of the same information.

- [ ] Review existing concept trees and revise those that need it. Preserve useful structures already built.

### 2 Develop the remaining character frameworks

- [ ] Review each existing framework through reading, discussion, and refinement. Only two currently meet the intended standard.

- [ ] Replace surface-level questions with useful guidance, choices, and optional depth.

- [ ] Add the additional models collected for understanding and developing fictional characters.

### 3 Add change frameworks

- [ ] Explore why people change, what triggers change, resistance, the process itself, consequences, and lasting transformation.

- [ ] Consider grief as one subject. Allow overlapping states, reversals, and different paths instead of requiring a fixed sequence.

### 4 Add relationship frameworks

- [ ] Explore how relationships form, develop, intensify, weaken, and end.

- [ ] Include stages and intensity, closeness, trust, conflict, dependence, and changing loyalties.

<!-- page -->

## Narrative nodes and physical inventory

### 5 Rework Story Beat

- [ ] Read through every current field and remove unnecessary leftovers from earlier Quest and Event designs.

- [ ] Decide through discussion which existing and new fields are useful. Keep simple use easy, with deeper detail available when needed.

### 6 Rework Story Location

- [ ] Remove, combine, and add fields to make the inspector clear, visually appealing, and intuitive.

- [ ] Add location-specific frameworks and wizards, adapting existing models or creating new ones.

### 7 Rework Story Item

- [ ] Help create captivating, elegant items with complementary physical, mechanical, and narrative uses.

- [ ] Support origins, hidden identities, twists, and changing understanding of what an item is or means.

- [ ] Develop prompts that improve the item's place in the game, beyond basic description.

### 8 Review narrative subnodes and other inspectors

- [ ] Keep what works; remove, combine, reorganize, or add fields where needed.

- [ ] Apply the newer standard of clarity, usefulness, visual appeal, and optional depth across the software.

### 9 Improve narrative node organization

- [ ] Create helpful categories, informed by the mechanics viewer's Build, Add, and Modify organization.

- [ ] Reassess Base, Subnodes, and Supporting. Move Templates into Created Content.

### 10 Build and test the physical inventory

- [ ] Photograph and enter real props available for games to create a useful visual inventory.

- [ ] Use actual inventory work to test the inspectors and refine fields that prove awkward or unnecessary.

<!-- page -->

## Character appearance and artificial intelligence

### 11 Add a character appearance wizard

- [ ] Guide descriptions of stature, build, face, hair, distinguishing features, posture, clothing, and accessories.

- [ ] Keep details optional, support custom descriptions, and save the result with the character.

- [ ] Make the visual description available to future portrait generation.

### 12 Add AI assisted story assembly

- [ ] Connect an AI service such as OpenRouter for model access and generation.

- [ ] Use selected or whole-game material: characters, relationships, locations, items, twists, values, economy, plot, and world descriptions.

- [ ] Provide separate controls for real-world playing time and fictional elapsed time, with relevant experience settings such as player count and tone.

- [ ] Distinguish fixed facts, flexible material, and permitted additions. Generate an outline for review before expanding scenes, dialogue, and facilitator instructions.

- [ ] Check continuity and contradictions. Keep generated suggestions reviewable, preserve original writing, and make accepted results editable in the story and node views.

### 13 Add AI model selection

- [ ] Provide an in-app model picker, saved preferences, relevant capabilities, input limits, and estimated generation costs.

- [ ] Record which model and settings produced each version. Consider separate models for outlining, dialogue, and consistency checking.

### 14 Add character portrait generation

- [ ] Use saved character and appearance data to prepare an editable image prompt. Allow image-model selection and review of alternatives.

- [ ] Support a shared visual style across the game and reference images where the selected model permits them.

- [ ] Save approved images into the existing character image slots. Preserve approved pictures when character details change and offer regeneration.

<!-- page -->

## Live devices and game operation

### 15 Add live tracker integration

- [ ] Investigate API access and test the existing Trackimo devices before considering replacements. Measure actual reporting delays and coverage.

- [ ] Display assigned trackers on physical location maps, with update times, battery information, and clear stale-position indicators.

- [ ] Consider movement trails and zone notifications. Investigate indoor positioning separately for room schematics.

### 16 Add live sensor events and notifications

- [ ] Connect compatible sensors or gateways and show activations through notifications and brief visual animations.

- [ ] Identify the responsible player, character, or team where possible, using assigned devices or an identification step.

- [ ] Record activations and completed tasks in game histories. Show connection status so organizers can see unavailable devices.

### 17 Add automatic task completion and scoring

- [ ] Create rules with a trigger, conditions, and effects. Connect sensor activations or zone entry to tasks, points, and game outcomes.

- [ ] Maintain separate scores for each game, assigned to players, characters, or teams. Make related results accessible through the relevant profiles without double counting.

- [ ] Support prerequisites, once-only awards, repeatable tasks, and cooldowns. Prevent duplicate awards and retain an explainable history with organizer corrections.

- [ ] Distinguish arrival from proof that an item was found or a task completed. Account for uncertain GPS positions and delayed reports.

### 18 Develop reusable ESP32 gadgets

- [ ] Connect sensor inputs and physical feedback such as lights, sounds, or displays. Let gadgets send meaningful events and receive game commands.

- [ ] Keep sensor reading and immediate feedback on the gadget; configure game meaning, task rules, rewards, and history in Larpcraft.

- [ ] Plan a local network and persistent game service, with remote access when connectivity permits. Handle reconnects and repeated or delayed messages.

- [ ] Start with one ESP32, one button, and one light: show the button event in Larpcraft and change the light from an organizer control.

<!-- page -->

## Resources for ideation

These are references to inspect for specific patterns. Links do not imply complete compatibility, automatic integration, or a recommendation to copy an entire interface. Check current capabilities and terms before implementation.

- [Arcweave](https://arcweave.com/features) Narrative graphs, reusable story components, branching, and playtesting.

- [articy draft](https://www.articy.com/en/support/tutorials/) Nested narrative flows, entities, templates, and inspector design.

- [Kanka](https://kanka.io/features) Linked characters, groups, locations, items, inventories, and relationships.

- [LegendKeeper](https://www.legendkeeper.com/features/) Nested maps and pages, map pins, templates, and fast linking.

- [Campfire](https://www.campfirewriting.com/write) Customizable writing panels, character sheets, relationship webs, and templates.

- [Hero Forge](https://heroforge.com/content/support-docs/face-customizer-2/) Appearance choices, presets, detailed controls, and visual feedback.

- [Novelcrafter](https://www.novelcrafter.com/courses/ultimate-beginners-guide/setting-up-the-codex) A story reference library that supplies relevant material to AI.

- [Novelcrafter and OpenRouter](https://openrouter.ai/works-with-openrouter/novelcrafter) An example of model selection and external AI provider integration.

- [Home Assistant](https://www.home-assistant.io/docs/automation/editor/) Visual triggers, conditions, and actions for device automation.

- [Node RED](https://nodered.org/) Connected flows for receiving, transforming, and routing device events.

- [ESPHome](https://esphome.io/) Reusable ESP32 device configurations, components, and device management.

- [Traccar](https://www.traccar.org/) Live tracking, movement history, device events, and notifications.

- [Traccar geofences](https://www.traccar.org/geofences/) Map zones and events for entering or leaving an area.

- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs) Returning structured story suggestions that an application can validate.

- [OpenRouter image generation](https://openrouter.ai/blog/announcements/image-api/) Image model access and capability discovery for portrait generation.

- [Trackimo API enquiries](https://omni.tracki.com/hc/help/articles/1739226619-ap) Starting point for confirming access for the existing tracker models and account.

- [ESP32 messaging](https://docs.espressif.com/projects/esp-mqtt/en/latest/esp32/) Official messaging reference for sending gadget events and receiving commands.

<!-- page -->

## Using and maintaining this briefing

Upload the Word document or this Markdown file to the other chatbot. A link to a file on this computer will not grant an external chatbot access. If a chatbot cannot open a reference URL, paste the relevant excerpt or provide an accessible copy.

For a focused session, choose one backlog area and include screenshots of the current interface when useful. Request concrete alternatives, example field layouts, and a small test case before selecting a redesign.

The Markdown file is the editable master. The Word document is an uploadable snapshot. Neither automatically receives new chat messages. Refresh the master after significant decisions or implementation changes, update the review date, and regenerate the Word copy when needed.

A stable online URL is a possible later step: publish the briefing to an intentionally shared document or repository page and update that source. Public access and chatbot retrieval depend on the chosen host and permissions. A chat share link is a snapshot and should not be treated as an automatically updating project record.

When updating, retain unresolved ideas, distinguish decisions from suggestions, move completed work into the baseline, and preserve the remaining backlog. Exclude API keys, private player information, and unpublished game secrets from any public version.
