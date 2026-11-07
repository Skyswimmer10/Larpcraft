# King, Warrior, Magician & Lover character wizard

The existing `jungianMasculineArchetypes` framework now has a dedicated character creation flow based on the two supplied character-wizard prompts. The catalogue label remains **Jungian Masculine Archetypes**; its character wizard is titled **King, Warrior, Magician & Lover**.

## Flow

1. **Foundation:** name, one-sentence concept, a primary energy or Balanced mix, and up to two optional supporting energies. Context and attachment to an existing character are under an optional disclosure.
2. **Primary energy:** mature core, selectable strengths, six shadow leans, and an optional historical incident. Balanced mix presents each of the four energies separately.
3. **Supporting energies:** one card per selected energy, up to three strengths and None/Mild/Moderate shadow intensity. This step disappears when no supporting energies are selected.
4. **Interactions:** selectable directional and pairwise effects among the chosen energies. An optional switch exposes possible active/passive shadow distortions. A short scene or habit can illustrate them.
5. **Expression & limits:** carry forward selected strengths, choose story friction, and optionally set shadow awareness and developmental stage. Longer lists are paged.
6. **Synthesis:** compact overview, full editable profile, editable suggested hook, plain-text export, and save to game or game plus library.

Shadow effects and suggested hooks are explicitly possibilities rather than automatically asserted events. Secondary intensity does not imply an active or passive shadow. Pairwise shadow options are limited to the combinations described in the supplied prompts.

## Persistence and compatibility

- Uses the existing character wizard record and save/revise machinery; no separate character repository is introduced.
- Records use `kwml-prose` format and retain flat string answers under `kwml:` keys, plus the existing `archetype` primary-energy key.
- Per-energy answer banks survive switching the primary energy. Saved interaction selections are limited to the currently chosen energies and enabled shadow view.
- Existing free-text answers remain available under **Retained earlier writing**, with their original primary-energy context where known.
- A manually edited profile is preserved when choices change. Rebuilding it from current choices requires an explicit action.
- Earlier developing-form reference content remains available in the framework reference. Canonical mature shadow labels use Trickster / Innocent One and Addict / Impotent; older names remain visible as aliases.
- The feminine archetype framework and the separate story archetype concepts are unchanged by this feature.

## Validation

- Automated coverage checks branching, balanced mixes, selection limits, relevant interactions, historical incident opt-in, legacy writing, manual prose, save/reopen and framework reference content.
- Browser verification used a separate copy of local game/library data on port 5194. It covered creation, save to game and library, reload/reopen, profile editing, text export and the balanced path.
- Final full suite: 737 tests passed across 121 files. Production build passed.
