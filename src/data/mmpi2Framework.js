// User-supplied nine-domain character-writing adaptation.
export const mmpi2Framework = {
  "id": "mmpi2CharacterProfile",
  "label": "MMPI-2 — Character Profile",
  "title": "MMPI-2 — Character Profile",
  "color": "#79B9D9",
  "icon": "user",
  "layout": "profileDomains",
  "blurb": "A nine-domain character profile: response reliability, psychological functioning, relationships, and coping.",
  "summary": "A simplified MMPI-2-inspired writing framework from the supplied text. Describe multiple dimensions together rather than assigning one personality type.",
  "usage": "Character-writing reference, not the official MMPI-2 assessment or a diagnostic scoring tool. The five levels are descriptive writing prompts, not clinical scores or cutoffs. Rate each lowest-level characteristic separately: higher is not automatically worse, and the subdomains can point in different directions.",
  "levels": [
    "Very Low",
    "Low",
    "Average",
    "Elevated",
    "Very Elevated"
  ],
  "psy5": [
    "Aggressiveness",
    "Psychoticism",
    "Disconstraint",
    "Negative Emotionality / Neuroticism",
    "Introversion / Low Positive Emotionality"
  ],
  "psy5Note": "The supplied text also offers PSY-5 as a compact five-dimension overview. Keep it alongside the nine domains; they are not a one-to-one hierarchy. Aggression and activation, in particular, should be considered separately.",
  "example": "A character could be highly socially confident, moderately suspicious, emotionally stable, somewhat impulsive, highly activated, and low in aggression.",
  "context": "Yes — you mean the Minnesota Multiphasic Personality Inventory–2 (MMPI-2), not Massachusetts. It is a 567-item adult psychological assessment used in clinical work and also in forensic settings such as child-custody, personal-injury, pre-trial criminal, corrections, and competency/commitment evaluations.",
  "caution": "One forensic caution: MMPI-2 scores themselves don't determine whether somebody is guilty, competent, dangerous, a suitable parent, or has a particular diagnosis. The official forensic reports integrate the profile into broader areas such as validity, symptom patterns, interpersonal functioning, mental-health considerations and setting-specific considerations, and professional MMPI materials require appropriately qualified users.",
  "phases": [
    {
      "key": "1",
      "name": "Response Reliability & Self-Presentation",
      "short": "How consistent is the account, and how is the character presenting themselves?",
      "detail": "This asks first whether the psychological profile can actually be trusted. It looks for inconsistent responding, unusual responding, exaggeration of problems, minimizing problems, or presenting oneself in an unrealistically positive way. In forensic evaluations this is especially important because people may have reasons to look either healthier or more impaired than they actually are. MMPI-2 validity indicators include VRIN, TRIN, F, Fp, FBS, L, K and S.",
      "children": [
        "Consistency",
        "Exaggeration",
        "Minimization / positive presentation"
      ]
    },
    {
      "key": "2",
      "name": "Emotional Distress & Negative Emotionality",
      "short": "How strongly does the character experience negative emotion?",
      "detail": "This domain represents how strongly someone experiences depression, anxiety, worry, guilt, emotional discomfort and general psychological distress. At the low end, a person may be emotionally stable and relatively resilient; at the high end, negative emotions may become persistent and interfere with everyday functioning. Relevant MMPI-2 measures include Depression, Psychasthenia, Anxiety, Depression content scales, RCd, RC2, RC7 and PSY-5 Negative Emotionality/Neuroticism.",
      "children": [
        "Negative emotionality",
        "Depression / low positive emotion",
        "Anxiety / worry",
        "Fear"
      ]
    },
    {
      "key": "3",
      "name": "Somatic & Health Focus",
      "short": "How prominent are bodily symptoms and health concerns?",
      "detail": "This describes the extent to which physical symptoms, bodily sensations and health concerns form part of someone's psychological experience. An elevation does not by itself mean symptoms are fabricated; psychological distress and genuine medical problems can coexist. The MMPI-2 examines this through scales such as Hypochondriasis, Hysteria-related somatic complaints, RC1 Somatic Complaints and the Health Concerns content scale.",
      "children": [
        "Physical complaints",
        "Health concern"
      ]
    },
    {
      "key": "4",
      "name": "Thought & Perceptual Functioning",
      "short": "How does the character experience and interpret reality?",
      "detail": "This domain concerns how conventionally or unusually someone experiences and interprets reality. It ranges from ordinary, organized thinking through increasingly unusual perceptions, beliefs, cognitive experiences or feelings of disconnection from oneself and others. Relevant MMPI-2 scales include RC8 Aberrant Experiences, parts of the traditional Schizophrenia scale, Bizarre Mentation and PSY-5 Psychoticism. Importantly, elevation on these scales is not the same thing as diagnosing schizophrenia or another psychotic disorder.",
      "children": [
        "Conventional ↔ unusual thinking",
        "Unusual experiences",
        "Reality interpretation"
      ]
    },
    {
      "key": "5",
      "name": "Trust, Suspicion & Cynicism",
      "short": "How does the character interpret other people’s motives?",
      "detail": "This measures how someone interprets other people's motives. At one end is interpersonal trust and a generally benign view of others; moving upward you see skepticism, cynicism and guardedness, and at more extreme levels there may be strong beliefs that other people intend harm or exploitation. MMPI-2 scales relevant here include Paranoia, RC3 Cynicism, RC6 Ideas of Persecution, Cynicism and Interpersonal Suspiciousness.",
      "children": [
        "Trust",
        "Cynicism",
        "Persecutory interpretation"
      ]
    },
    {
      "key": "6",
      "name": "Behavioral Control & Disconstraint",
      "short": "How does the character manage impulses, rules, and consequences?",
      "detail": "This domain asks how strongly behavior is regulated by rules, planning and consideration of consequences. Lower disconstraint generally corresponds to greater inhibition and self-control, while higher levels can involve impulsiveness, risk-taking, rule-breaking or difficulty accepting restrictions. Relevant MMPI-2 measures include RC4 Antisocial Behavior, Antisocial Practices and PSY-5 Disconstraint. These scores describe tendencies rather than establishing that someone has committed particular acts.",
      "children": [
        "Self-control",
        "Impulsivity",
        "Rule conformity"
      ]
    },
    {
      "key": "7",
      "name": "Aggression, Anger & Activation",
      "short": "Consider conflict intensity and energy separately.",
      "detail": "This domain combines the intensity with which someone approaches conflict with their general level of psychological activation. A person may range from restrained and conflict-avoidant through assertive and energetic to highly irritable, aggressive, restless or excessively activated. Relevant measures include Anger, Hostility, PSY-5 Aggressiveness, Hypomania and RC9 Hypomanic Activation. Because aggression and activation are different phenomena, a detailed assessment would eventually separate these into two subdomains.",
      "children": [
        "Anger",
        "Aggressiveness",
        "Activation / energy"
      ]
    },
    {
      "key": "8",
      "name": "Social & Interpersonal Style",
      "short": "How does the character relate to others across situations?",
      "detail": "This describes how a person functions around other people rather than simply asking whether they are “introverted or extroverted.” It can capture social withdrawal, shyness, discomfort, alienation, dominance, interpersonal confidence and problems within close relationships or families. Relevant MMPI-2 measures include Social Introversion, Social Discomfort, Family Problems, Dominance and PSY-5 Introversion/Low Positive Emotionality.",
      "children": [
        "Introversion",
        "Social confidence",
        "Dominance / passivity",
        "Relationship functioning"
      ]
    },
    {
      "key": "9",
      "name": "Adjustment, Coping & Psychological Resources",
      "short": "What helps the character cope, function, and seek support?",
      "detail": "This final area asks how effectively someone manages demands placed on them. It includes self-esteem, psychological resilience, ability to function at work or school, willingness to discuss difficulties and openness to treatment or evaluation. Relevant MMPI-2 scales include Ego Strength, Low Self-Esteem, Work Interference and Negative Treatment Indicators. This can be particularly important because two people with similar symptoms may differ dramatically in their ability to cope with them.",
      "children": [
        "Self-esteem",
        "Resilience",
        "Functional capacity",
        "Openness to help"
      ]
    }
  ]
};
