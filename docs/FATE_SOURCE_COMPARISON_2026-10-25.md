# FATE character adaptation: source comparison

Reviewed 25 October 2026. This records a comparison, not approval for further questionnaire changes. The only accompanying product change restores the colored character step navigation: Start, Focus, Authority, Tribe, Emotion, Character description. It remains a left rail on larger screens and becomes a horizontally scrollable navigation row on narrow screens.

## Sources and scope

- **The Behavior OPS Manual - Chase Hughes Extract[33-38].pdf**, six supplied pages, printed pages 16–21. This is the primary reference for the original FATE definitions. The final page starts the separate Six-Axis Model; that model is outside this comparison.
- **New Rich Text Document.rtf**, supplied business/marketing commentary about applying FATE. This is an interpretation of Hughes' model, not an equivalent primary description. Its authority discussion emphasizes composure and credibility, and its examples apply the model to customers.
- Current implementation: `FateCharacter.jsx`, `fateCharacter.js`, character overrides in `fatePurposes.js`, shared choices in `fateWizard.js`, and saved/output handling in `lib/fateWizard.js`.

The documents were read as reference content. Their exhortations to apply influence techniques were not treated as instructions to modify software. This review compares conceptual fidelity; it does not establish the scientific validity of the sources' biological explanations or claims about predictable compliance.

## Overall finding

Larpcraft is recognizably FATE-inspired, with a substantial change of purpose: an influence/response model has become a fictional character-development lens. Its four headings remain, but they now organize a person's recurring attention, trust, belonging and emotional responses. That can be useful without being a complete reproduction of the original framework or a comprehensive personality model.

The closest correspondence is Tribe and the situation-to-response structure of emotional patterns. The most meaningful shifts are sensory-first Focus and the replacement of much of Authority's power/compliance emphasis with trust. Calling this a **FATE-inspired character profile** would describe its scope accurately; no label change is made as part of this review.

## Focus — meaningful reframing

The manual's printed pages 16–17 connect attention capture to potential threat and potential value. Sensory examples include a sudden sound, movement and unusual color; a captivating story is also an example. Printed page 21 connects interruption of a running behavioral script with renewed attention. The business commentary emphasizes novelty, breaking distraction and becoming present.

Current character Focus records visual, audio and kinesthetic signals, overlooked signals, custom triggers, individual attention strength and examples/exceptions. Threat, gain and uncertainty remain available under optional Meaning of the signal.

The concrete choices therefore have source support, but VAK grouping, six attention positions and separate per-signal cards are Larpcraft design choices. They are not source-provided typologies or calibrated measurements. The larger departure is treating what a person notices as a descriptive tendency, with the signal's significance secondary. In the manual, significance as threat or value is central. A character who notices shouting is only partly described until the author knows what shouting means to that person.

## Authority — the largest semantic shift

Printed pages 17–18 emphasize responding to actual or perceived power, including obedience and the consequences of defiance. A person can experience authority without liking or trusting its holder. The RTF's quiet-authority examples give greater prominence to certainty, composure, presence, use of space and clear language.

The character wizard asks whom they trust and whose judgment carries weight. It retains rank, expertise, resources, force, institutions, actual/perceived power and visible markers. However, the character interface excludes the existing situational questions about the cost of defiance, the requested compliant response and legitimacy; generated prose describes the selected sources as trusted. Familiar and close people can also be selected.

Those additions help characterize people, but familiarity alone does not specify authority. A trusted sibling, a feared commander and a knowledgeable guide may influence behavior through different mechanisms. The current screen can describe all three, yet its default framing blurs those distinctions. Relative to the manual, this is more than a wording change; relative to the business commentary it is closer.

## Tribe — strong correspondence, with useful authoring extensions

Printed pages 18–19 emphasize group protection/resources, attention to other members, conformity, enforcement of norms and monitoring one's own behavior. The current group-behavior choices retain those six broad mechanisms. Reputation, protection, resources, rank and close relationships also preserve much of the group's practical significance.

Named people/groups, linked game profiles, per-group membership, multiple loyalties, independence and conflicting allegiances extend the source into story authoring. These help define a fictional social world. Friendships or loyalty lists alone would not capture the original Tribe mechanism, but the current conformity and group-behavior choices keep that mechanism present. The more detailed enforcement-consequence range is omitted from the character interface.

## Emotion — strong structural correspondence, broader content

Printed pages 19–21 distinguish inherited/protective scripts from scripts developed through experience and repetition, including movement toward or away from something. The current emotional-pattern cards connect a situation/trigger, mixed feelings, an impulse, usual behavior, intensity and exceptions. Advanced detail retains a broad protective/learned origin distinction.

This is close in structure. The named feelings, sliders and exceptions are authoring choices, rather than a source checklist. Their purpose is a repeatable fictional characterization with room for change. The source also covers automatic routines that need not involve a conspicuous named emotion; the current screen concentrates more narrowly on emotional patterns. Script interruption and the effect of openly discussing a script are not explicit character controls, although a writer can describe such cases in exceptions or free text.

## The bigger difference: four biography sections versus a dynamic interaction

The manual connects the pillars: attention can orient to an authority or a group, and emotional reactions can follow threatened exclusion or defiance. Larpcraft saves the four contributions into character prose, without requiring an explicit causal connection between them or a particular influence situation. Removing speaker, message, intended outcome and scene-intensity setup was appropriate for character discovery, but also made this mode further removed from the model's original application. The separate Communication mode remains the natural place to apply a completed profile to a particular exchange.

## Possible next adjustments — not implemented

1. Keep the sensory cards; optionally connect each trigger to why it matters: possible threat, something valued or something unfamiliar. This restores the signal/meaning connection without restoring large loss/gain questionnaires.
2. Distinguish Authority as trusted judgment, perceived power or both. A compact question about their usual response to a request could preserve the difference between believing, following and complying under pressure.
3. Keep the existing Tribe and emotional-pattern structures. They already preserve useful source mechanisms; the comparison does not justify returning every removed field.
4. Make links among the pillars explicit in prose when the author has actually recorded them, rather than inventing a causal explanation. Use Communication mode for the specific interaction.

These are options for discussion, not a proposal to make the original manual's deterministic language into guaranteed game behavior.
