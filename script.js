"use strict";

/* =========================================================
   Civic OS — script.js
   Report. Connect. Resolve.

   1. Reference data
   2. Demo AI engine
   3. Demo data
   4. App state & helpers
   5. Screen switching
   6. Home
   7. Report flow
   8. Issue explorer + detail sheet
   9. Dashboard
   10. Community matching
   11. Civic AI
   12. Event binding
   13. Init
   ========================================================= */


/* =========================================================
   1. REFERENCE DATA
   ========================================================= */

const CATEGORIES = {
  roads: {
    label: "Roads",
    aiLabel: "Road Infrastructure",
    department: "Manipur PWD",
    icon: "construction",
    keywords: [
      "pothole", "road", "street", "crack", "asphalt",
      "pavement", "footpath", "sidewalk", "speed bump", "manhole"
    ],
    action:
      "Inspect the affected road and determine whether repair, patching or resurfacing is required.",
    skills: ["Infrastructure Assessment", "Mapping", "Photography"],
  },

  garbage: {
    label: "Garbage",
    aiLabel: "Waste & Sanitation",
    department: "Sanitation",
    icon: "trash-2",
    keywords: [
      "garbage", "trash", "waste", "litter", "dump",
      "bin", "rubbish", "smell", "collection"
    ],
    action:
      "Schedule a sanitation crew to clear the waste and review the local collection route.",
    skills: ["Community Outreach", "Event Organizing", "Graphic Design"],
  },

  streetlights: {
    label: "Streetlights",
    aiLabel: "Public Lighting",
    department: "Public Lighting",
    icon: "lightbulb",
    keywords: [
      "streetlight", "street light", "lamp", "light",
      "dark", "bulb", "pole", "wire"
    ],
    action:
      "Send a lighting technician to inspect the fixture, wiring and power supply.",
    skills: ["Electrical Repair", "Mapping"],
  },

  water: {
    label: "Water",
    aiLabel: "Water & Drainage",
    department: "Water Department",
    icon: "droplets",
    keywords: [
      "water", "leak", "pipe", "drain", "sewage",
      "flood", "tap", "supply", "overflow", "waterlog"
    ],
    action:
      "Dispatch a water crew to locate the source, isolate the problem and restore safe supply.",
    skills: ["Plumbing", "Infrastructure Assessment"],
  },

  health: {
    label: "Public health",
    aiLabel: "Public Health",
    department: "Public Health",
    icon: "heart-pulse",
    keywords: [
      "mosquito", "disease", "health", "clinic",
      "hospital", "stagnant", "dengue", "rats",
      "hygiene", "sick"
    ],
    action:
      "Request a public health inspection and schedule preventive treatment of the area.",
    skills: ["Public Health", "Community Outreach"],
  },

  education: {
    label: "Education",
    aiLabel: "Education Facilities",
    department: "Education Department",
    icon: "graduation-cap",
    keywords: [
      "school", "classroom", "teacher", "student",
      "desk", "library", "college", "books"
    ],
    action:
      "Ask the education department to audit the facility and plan repairs or resources.",
    skills: ["Teaching", "Project Management", "Infrastructure Assessment"],
  },

  environment: {
    label: "Environment",
    aiLabel: "Environment",
    department: "Environment Department",
    icon: "leaf",
    keywords: [
      "tree", "pollution", "smoke", "air", "noise",
      "river", "lake", "park", "burning", "cut down"
    ],
    action:
      "Have the environment department assess the impact and enforce applicable regulations.",
    skills: ["Environmental Science", "Mapping", "Data Analysis"],
  },

  safety: {
    label: "Public safety",
    aiLabel: "Public Safety",
    department: "Public Safety",
    icon: "shield-alert",
    keywords: [
      "signal", "crime", "theft", "unsafe", "harass",
      "accident", "fire", "traffic light", "junction", "crossing"
    ],
    action:
      "Alert public safety officers to secure the area and coordinate an urgent response.",
    skills: ["Community Outreach", "Mapping"],
  },

  other: {
    label: "Other",
    aiLabel: "General Civic Issue",
    department: "Municipal Helpdesk",
    icon: "ellipsis",
    keywords: [],
    action:
      "Review the report and route it to the most relevant municipal department.",
    skills: ["Community Outreach"],
  },
};

const STATUSES = [
  "Reported",
  "Verified",
  "In Progress",
  "Resolved"
];

/* =========================================================
   PWD ROAD INTELLIGENCE — MVP ROUTING
   Source-backed division names are kept separate from the
   routing logic. Jurisdiction matching is deliberately
   conservative until an official GIS/jurisdiction dataset
   is connected.
   ========================================================= */

const PWD_DIVISIONS = [
  "Imphal East Division",
  "Imphal West Division",
  "Highway South Division",
  "Thoubal Division",
  "Bishnupur Division",
  "Churachandpur Division",
  "Chandel Division",
  "Tamenglong Division",
  "Ukhrul Division",
  "Senapati Division",
  "NH-I Division",
  "NH-III Division"
];

function routeRoadReport(location) {
  const text = String(location || "").toLowerCase();

  const districtMatches = [
    ["imphal east", "Imphal East Division"],
    ["imphal-east", "Imphal East Division"],
    ["imphal west", "Imphal West Division"],
    ["imphal-west", "Imphal West Division"],
    ["thoubal", "Thoubal Division"],
    ["bishnupur", "Bishnupur Division"],
    ["churachandpur", "Churachandpur Division"],
    ["churachanpur", "Churachandpur Division"],
    ["chandel", "Chandel Division"],
    ["tamenglong", "Tamenglong Division"],
    ["ukhrul", "Ukhrul Division"],
    ["senapati", "Senapati Division"]
  ];

  const match = districtMatches.find(
    ([term]) => text.includes(term)
  );

  if (match) {
    return {
      authority: "Manipur Public Works Department (PWD)",
      division: match[1],
      routingConfidence: 92,
      routingNote: "MVP jurisdiction match based on the location text."
    };
  }

  return {
    authority: "Manipur Public Works Department (PWD)",
    division: "PWD jurisdiction review",
    routingConfidence: 62,
    routingNote: "Exact division requires an official jurisdiction/GIS lookup."
  };
}

function assessRoadDamage(description) {
  const text = String(description || "").toLowerCase();

  const defectSignals = [
    ["pothole", "Pothole"],
    ["potholes", "Pothole"],
    ["crack", "Road crack"],
    ["cracks", "Road crack"],
    ["broken surface", "Surface damage"],
    ["damaged road", "Surface damage"],
    ["collapsed", "Severe surface failure"],
    ["sinkhole", "Severe surface failure"],
    ["erosion", "Road edge/erosion damage"]
  ];

  const matches = defectSignals
    .filter(([term]) => text.includes(term))
    .map(([, label]) => label);

  const unique = [...new Set(matches)];

  let severity = "Medium";

  if (
    /deep|huge|large|dangerous|unsafe|accident|blocked|collapse|sinkhole/i.test(text)
  ) {
    severity = "High";
  } else if (
    /small|minor|slight|shallow/i.test(text)
  ) {
    severity = "Low";
  }

  return {
    defect: unique[0] || "Road surface damage",
    additionalDefects: unique.slice(1),
    severity
  };
}



const PRIORITY_RANK = {
  High: 3,
  Medium: 2,
  Low: 1
};

const HIGH_PRIORITY_SIGNALS = [
  "danger",
  "dangerous",
  "accident",
  "flood",
  "fire",
  "emergency",
  "unsafe",
  "injur",
  "collapse",
  "exposed wire",
  "live wire",
  "electrocut",
  "sparking",
];

const IMPACT_SIGNALS = [
  "school",
  "children",
  "kids",
  "hospital",
  "elderly",
  "blocked",
  "large",
  "deep",
  "night",
  "every day",
  "many",
];

const LOW_SIGNALS = [
  "minor",
  "small",
  "cosmetic",
  "slight",
  "faded"
];

const SKILLS = [
  "Mapping",
  "Data Analysis",
  "Graphic Design",
  "Social Media",
  "Community Outreach",
  "Event Organizing",
  "Infrastructure Assessment",
  "Electrical Repair",
  "Plumbing",
  "Public Health",
  "Environmental Science",
  "Photography",
  "Teaching",
  "Project Management",
];

const RESPONSE_TIME = {
  High: "Within 24 hours",
  Medium: "Within 3–5 days",
  Low: "Within 2 weeks"
};

const STOPWORDS = new Set([
  "near",
  "there",
  "with",
  "from",
  "that",
  "this",
  "have",
  "been",
  "very",
  "into",
  "outside",
  "front",
  "behind",
  "next",
  "close",
  "area",
  "side",
  "some",
  "they",
  "which",
  "their",
  "about",
  "still",
  "since",
  "days",
  "week",
  "morning",
  "people",
  "every",
]);


/* =========================================================
   2. DEMO AI ENGINE
   ========================================================= */

function matchTerms(text, terms) {
  return terms.filter((term) =>
    new RegExp("\\b" + escapeRegExp(term), "i").test(text)
  );
}

function detectCategory(text) {
  let bestKey = "other";
  let bestHits = 0;

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const hits = matchTerms(text, cat.keywords).length;

    if (hits > bestHits) {
      bestKey = key;
      bestHits = hits;
    }
  }

  return {
    key: bestKey,
    hits: bestHits
  };
}

function analyzeReport({
  categoryKey,
  description,
  location,
  hasPhoto
}) {
  const text = description.toLowerCase();
  const detected = detectCategory(text);

  let key =
    categoryKey && categoryKey !== "other"
      ? categoryKey
      : detected.key;

  const autoDetected =
    (!categoryKey || categoryKey === "other") &&
    detected.key !== "other";

  const chosenHits =
    categoryKey && CATEGORIES[categoryKey]
      ? matchTerms(
          text,
          CATEGORIES[categoryKey].keywords
        ).length
      : 0;

  const suggestion =
    categoryKey &&
    categoryKey !== "other" &&
    chosenHits === 0 &&
    detected.hits > 0 &&
    detected.key !== categoryKey
      ? detected.key
      : null;

  if (!CATEGORIES[key]) {
    key = "other";
  }

  const cat = CATEGORIES[key];

  const highHits = matchTerms(
    text,
    HIGH_PRIORITY_SIGNALS
  );

  const impactHits = matchTerms(
    text,
    IMPACT_SIGNALS
  );

  const lowHits = matchTerms(
    text,
    LOW_SIGNALS
  );

  let priority = "Medium";

  if (
    highHits.length ||
    impactHits.length >= 2
  ) {
    priority = "High";
  } else if (
    lowHits.length &&
    !impactHits.length
  ) {
    priority = "Low";
  }

  const confidence = Math.min(
    97,
    62 +
      Math.min(
        Math.max(
          detected.hits,
          chosenHits
        ),
        3
      ) *
        8 +
      (categoryKey &&
      categoryKey !== "other"
        ? 8
        : 0) +
      (hasPhoto ? 6 : 0) +
      Math.min(
        highHits.length +
          impactHits.length,
        3
      ) *
        3
  );

  let riskNote = "";

  if (highHits.length) {
    riskNote =
      ` The report mentions risk factors (${highHits.join(
        ", "
      )}), so it is flagged for urgent attention.`;
  } else if (impactHits.length >= 2) {
    riskNote =
      ` Impact factors (${impactHits.join(
        ", "
      )}) raise its urgency.`;
  }

  const summary =
    `A citizen reports a ${cat.aiLabel.toLowerCase()} problem at ${location}. ` +
    `${firstSentence(description)}${riskNote}`;

  const recommendation =
    priority === "High"
      ? `Priority dispatch: ${cat.action} Secure the area until the work is complete.`
      : cat.action;

  const roadIntelligence =
    key === "roads"
      ? assessRoadDamage(description)
      : null;

  const routing =
    key === "roads"
      ? routeRoadReport(location)
      : {
          authority: cat.department,
          division: "Department routing",
          routingConfidence: 70,
          routingNote: "General civic department routing."
        };

  return {
    categoryKey: key,
    categoryLabel: cat.aiLabel,
    department: cat.department,
    authority: routing.authority,
    division: routing.division,
    routingConfidence: routing.routingConfidence,
    routingNote: routing.routingNote,
    roadIntelligence,
    priority,
    confidence,
    summary,
    recommendation,
    responseTime: RESPONSE_TIME[priority],
    signals: [
      ...highHits,
      ...impactHits
    ],
    skills: cat.skills,
    autoDetected,
    suggestion,
    duplicate: findPossibleDuplicate(
      key,
      location,
      description
    ),
  };
}

function tokenize(text) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(
          (w) =>
            w.length >= 4 &&
            !STOPWORDS.has(w)
        )
    )
  ];
}

function findPossibleDuplicate(
  categoryKey,
  location,
  description
) {
  const tokens = tokenize(
    `${location} ${description}`
  );

  let best = null;
  let bestScore = 0;

  for (const issue of issues) {
    if (
      issue.status === "Resolved" ||
      issue.category !== categoryKey
    ) {
      continue;
    }

    const issueTokens = new Set(
      tokenize(
        `${issue.location} ${issue.title}`
      )
    );

    const score = tokens.filter(
      (t) => issueTokens.has(t)
    ).length;

    if (score > bestScore) {
      best = issue;
      bestScore = score;
    }
  }

  return bestScore >= 2
    ? best
    : null;
}


/* =========================================================
   3. DEMO DATA
   ========================================================= */

const NOW = Date.now();
const HOUR = 36e5;

const SEED_ISSUES = [
  {
    id: "CIV-1042",
    title: "Large pothole near school entrance",
    category: "roads",
    priority: "High",
    status: "Reported",
    hoursAgo: 2,
    supporters: 23,
    area: "Ward 4",
    location:
      "Oakridge Primary School, Main Road",
    description:
      "A large, deep pothole has formed right at the school entrance. Cars swerve to avoid it and it is dangerous for children crossing in the morning."
  },

  {
    id: "CIV-1041",
    title:
      "Garbage collection delayed for a week",
    category: "garbage",
    priority: "Medium",
    status: "In Progress",
    hoursAgo: 9,
    supporters: 41,
    area: "Ward 2",
    location:
      "Market Street, Block C",
    description:
      "Garbage has not been collected for seven days. Bins are overflowing onto the footpath and the smell is spreading to nearby shops."
  },

  {
    id: "CIV-1040",
    title:
      "Streetlight repaired on Lake View Road",
    category: "streetlights",
    priority: "Low",
    status: "Resolved",
    hoursAgo: 30,
    supporters: 12,
    area: "Ward 3",
    location:
      "Lake View Road, near Pine Apartments",
    description:
      "One streetlight was flickering and then stopped working. The stretch was dark after 8pm."
  },

  {
    id: "CIV-1039",
    title:
      "Water pipe leaking onto footpath",
    category: "water",
    priority: "Medium",
    status: "Verified",
    hoursAgo: 14,
    supporters: 17,
    area: "Ward 1",
    location:
      "Station Road, near the bus depot",
    description:
      "A water pipe under the footpath has been leaking for two days. Clean water is being wasted and the path is slippery."
  },

  {
    id: "CIV-1038",
    title:
      "Open drain overflowing after rain",
    category: "water",
    priority: "High",
    status: "In Progress",
    hoursAgo: 26,
    supporters: 58,
    area: "Ward 5",
    location:
      "Riverside Colony, Lane 5",
    description:
      "The open drain overflows every time it rains and sewage water floods the lane. Residents cannot walk through safely."
  },

  {
    id: "CIV-1037",
    title:
      "Exposed wires on streetlight pole",
    category: "streetlights",
    priority: "High",
    status: "Verified",
    hoursAgo: 20,
    supporters: 34,
    area: "Ward 3",
    location:
      "Central Park, west gate",
    description:
      "The cover of the streetlight pole is missing and exposed wires are hanging at hand height. This is unsafe for children playing nearby."
  },

  {
    id: "CIV-1036",
    title:
      "Illegal dumping in empty plot",
    category: "garbage",
    priority: "Medium",
    status: "Reported",
    hoursAgo: 30,
    supporters: 9,
    area: "Ward 2",
    location:
      "Behind Green Avenue Apartments",
    description:
      "Construction waste and household trash are being dumped in the empty plot at night. The pile keeps growing."
  },

  {
    id: "CIV-1035",
    title:
      "Mosquito breeding in stagnant water",
    category: "health",
    priority: "Medium",
    status: "In Progress",
    hoursAgo: 48,
    supporters: 27,
    area: "Ward 5",
    location:
      "Riverside Colony playground",
    description:
      "Stagnant water has collected around the playground and there are a lot of mosquitoes. Several families reported dengue symptoms."
  },

  {
    id: "CIV-1034",
    title:
      "Leaking roof and broken desks at public school",
    category: "education",
    priority: "Medium",
    status: "Reported",
    hoursAgo: 52,
    supporters: 19,
    area: "Ward 6",
    location:
      "Government High School, Hill Road",
    description:
      "Two classrooms have a leaking roof and many desks are broken. Students are sitting on the floor during lessons."
  },

  {
    id: "CIV-1033",
    title:
      "Trees cut down without permission",
    category: "environment",
    priority: "Medium",
    status: "Verified",
    hoursAgo: 72,
    supporters: 46,
    area: "Ward 6",
    location:
      "Old Mill Road",
    description:
      "Six old trees were cut down along the road over the weekend. Residents are not aware of any approval for this."
  },

  {
    id: "CIV-1032",
    title:
      "Traffic signal not working at junction",
    category: "safety",
    priority: "High",
    status: "Resolved",
    hoursAgo: 96,
    supporters: 64,
    area: "Ward 1",
    location:
      "Clock Tower Junction",
    description:
      "The traffic signal at the junction has been off since the storm. There was almost an accident during rush hour."
  },

  {
    id: "CIV-1031",
    title:
      "Road cracks and waterlogging on ring road",
    category: "roads",
    priority: "Medium",
    status: "In Progress",
    hoursAgo: 120,
    supporters: 22,
    area: "Ward 4",
    location:
      "Sector 9 Ring Road",
    description:
      "Long cracks have opened up on the road surface and water collects in them after rain, slowing traffic."
  },

  {
    id: "CIV-1030",
    title:
      "Overflowing public bins at bus terminal",
    category: "garbage",
    priority: "Low",
    status: "Resolved",
    hoursAgo: 144,
    supporters: 8,
    area: "Ward 1",
    location:
      "City Bus Terminal",
    description:
      "The public bins at the terminal are full by noon and litter spreads across the waiting area."
  },

  {
    id: "CIV-1029",
    title:
      "Dark stretch with no working streetlights",
    category: "streetlights",
    priority: "Medium",
    status: "Reported",
    hoursAgo: 76,
    supporters: 31,
    area: "Ward 3",
    location:
      "Canal Walk, between bridges 2 and 3",
    description:
      "Almost all lamps on this walkway are out. It is completely dark at night and many people avoid walking home this way."
  }
];

let issues = [];
let nextIssueNumber = 1043;

const PEOPLE = [
  {
    name: "Aisha Rahman",
    role: "Student · GIS & mapping",
    area: "Ward 4",
    skills: [
      "Mapping",
      "Data Analysis",
      "Photography"
    ]
  },

  {
    name: "Daniel Okafor",
    role: "Civil engineer",
    area: "Ward 1",
    skills: [
      "Infrastructure Assessment",
      "Project Management"
    ]
  },

  {
    name: "Meera Iyer",
    role: "Graphic designer",
    area: "Ward 2",
    skills: [
      "Graphic Design",
      "Social Media"
    ]
  },

  {
    name: "Carlos Mendes",
    role: "Licensed electrician",
    area: "Ward 3",
    skills: [
      "Electrical Repair",
      "Infrastructure Assessment"
    ]
  },

  {
    name: "Priya Nair",
    role: "Community organizer",
    area: "Ward 5",
    skills: [
      "Community Outreach",
      "Event Organizing",
      "Social Media"
    ]
  },

  {
    name: "Tom Becker",
    role: "Retired plumber",
    area: "Ward 1",
    skills: [
      "Plumbing",
      "Infrastructure Assessment"
    ]
  },

  {
    name: "Lina Haddad",
    role: "Public health nurse",
    area: "Ward 5",
    skills: [
      "Public Health",
      "Community Outreach"
    ]
  },

  {
    name: "Green Ward Collective",
    role: "Environmental NGO · 120 members",
    area: "Citywide",
    org: true,
    skills: [
      "Environmental Science",
      "Event Organizing",
      "Community Outreach"
    ]
  },

  {
    name: "City Tech Students Club",
    role: "University club · 45 members",
    area: "Citywide",
    org: true,
    skills: [
      "Mapping",
      "Data Analysis",
      "Social Media",
      "Teaching"
    ]
  }
];

const MISSIONS = [
  {
    id: "M1",
    issueId: "CIV-1035",
    title:
      "Riverside drain & mosquito cleanup drive",
    needed: 12,
    joined: 7,
    description:
      "Clear stagnant water, distribute repellent and share prevention tips with families.",
    skills: [
      "Event Organizing",
      "Community Outreach",
      "Public Health"
    ]
  },

  {
    id: "M2",
    issueId: "CIV-1041",
    title:
      "Waste segregation awareness campaign",
    needed: 6,
    joined: 3,
    description:
      "Design posters and social posts so Market Street shops separate waste correctly.",
    skills: [
      "Graphic Design",
      "Social Media",
      "Community Outreach"
    ]
  },

  {
    id: "M3",
    issueId: "CIV-1029",
    title:
      "Map every unlit street in Ward 3",
    needed: 5,
    joined: 2,
    description:
      "Walk the ward at night, photograph dark spots and build a lighting gap map for the department.",
    skills: [
      "Mapping",
      "Data Analysis",
      "Photography"
    ]
  },

  {
    id: "M4",
    issueId: "CIV-1034",
    title:
      "Assess school building safety",
    needed: 4,
    joined: 1,
    description:
      "Document classroom damage and help the school prepare a repair request.",
    skills: [
      "Infrastructure Assessment",
      "Teaching",
      "Project Management"
    ]
  },

  {
    id: "M5",
    issueId: "CIV-1033",
    title:
      "Tree census on Old Mill Road",
    needed: 8,
    joined: 3,
    description:
      "Count and map remaining trees to support the environment department's investigation.",
    skills: [
      "Environmental Science",
      "Mapping",
      "Data Analysis"
    ]
  }
];

const WEEKLY_BASELINE = {
  reported: [6, 9, 7, 11, 8, 12, 5],
  resolved: [4, 6, 8, 7, 9, 8, 3]
};

const EXAMPLES = [
  {
    category: "roads",
    location:
      "Near the school entrance, Main Road",
    description:
      "There is a large pothole near the school entrance. Cars swerve around it and it is dangerous for children crossing."
  },

  {
    category: "garbage",
    location:
      "Market Street, Block C",
    description:
      "Garbage has not been collected for five days and bins are overflowing onto the footpath. The smell is very bad."
  },

  {
    category: "streetlights",
    location:
      "Canal Walk, Ward 3",
    description:
      "Three streetlights are not working on this stretch. It is completely dark at night and feels unsafe walking home."
  },

  {
    category: "other",
    location:
      "Station Road, near the bus depot",
    description:
      "A water pipe has burst and water is flooding the road since this morning."
  }
];


/* =========================================================
   4. APP STATE & HELPERS
   ========================================================= */

const state = {
  screen: "homeScreen",

  draftPhotoUrl: null,

  draft: null,

  analysis: null,

  analyzing: false,

  exampleIndex: 0,

  filters: {
    status: "All",
    category: "all",
    priority: "all",
    sort: "newest",
    query: ""
  },

  mySkills: new Set(),

  joinedMissions: new Set(),

  supported: new Set(),

  openIssueId: null,

  civicAiOpen: false,

  civicAiContext: null,

  civicAiMessages: [],

  civicActionId: null
};

const $ = (
  selector,
  root = document
) => root.querySelector(selector);

const $$ = (
  selector,
  root = document
) => [
  ...root.querySelectorAll(selector)
];

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[ch]
  );
}

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function refreshIcons() {
  if (
    window.lucide &&
    typeof window.lucide.createIcons ===
      "function"
  ) {
    window.lucide.createIcons();
  }
}

function firstSentence(text) {
  const clean = text
    .trim()
    .replace(/\s+/g, " ");

  const match = clean.match(
    /^.*?[.!?](\s|$)/
  );

  let sentence = (
    match ? match[0] : clean
  ).trim();

  if (sentence.length > 160) {
    sentence =
      sentence.slice(0, 157).trimEnd() +
      "…";
  }

  if (!/[.!?…]$/.test(sentence)) {
    sentence += ".";
  }

  return (
    sentence.charAt(0).toUpperCase() +
    sentence.slice(1)
  );
}

function makeTitle(description) {
  let title = firstSentence(description)
    .replace(/[.!?…]$/, "")
    .replace(
      /^(there is|there are|there's|i saw|i noticed|we have|we've got)\s+(a|an|the|some)?\s*/i,
      ""
    );

  if (title.length > 64) {
    title =
      title.slice(0, 61).trimEnd() +
      "…";
  }

  return (
    title.charAt(0).toUpperCase() +
    title.slice(1)
  );
}

function timeAgo(timestamp) {
  const minutes = Math.round(
    (Date.now() - timestamp) / 60000
  );

  if (minutes < 1) return "just now";

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(
    hours / 24
  );

  return `${days}d ago`;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function statusPill(status) {
  return `
    <span class="pill status-${slug(status)}">
      <span class="dot"></span>
      ${escapeHtml(status)}
    </span>
  `;
}

function priorityPill(priority) {
  return `
    <span class="pill pill-${priority.toLowerCase()}">
      ${escapeHtml(priority)} priority
    </span>
  `;
}

let toastTimer;

function toast(
  message,
  icon = "circle-check"
) {
  const el = $("#toast");

  if (!el) return;

  el.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  refreshIcons();

  el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => el.classList.remove("show"),
    2800
  );
}

function buildUpdates(
  status,
  reportedAt,
  department
) {
  const notes = {
    Reported:
      `Report received. Civic AI categorised it and routed it to ${department}.`,

    Verified:
      "Verified by the ward officer after a site check.",

    "In Progress":
      `${department} team assigned and work scheduled.`,

    Resolved:
      "Work completed and issue closed. Supporters were notified."
  };

  const lastIndex =
    STATUSES.indexOf(status);

  const elapsed =
    Date.now() - reportedAt;

  return STATUSES.slice(
    0,
    lastIndex + 1
  ).map((s, i) => ({
    status: s,
    note: notes[s],
    time:
      reportedAt +
      (elapsed * i) /
        (lastIndex + 1)
  }));
}

function createIssue(seed) {
  const analysis =
    analyzeReport({
      categoryKey: seed.category,
      description: seed.description,
      location: seed.location,
      hasPhoto: Boolean(seed.photo)
    });

  const reportedAt =
    seed.reportedAt ??
    NOW - seed.hoursAgo * HOUR;

  const department =
    CATEGORIES[seed.category]?.department ||
    "Municipal Helpdesk";

  return {
    id: seed.id,

    title: seed.title,

    category: seed.category,

    description: seed.description,

    location: seed.location,

    area: seed.area,

    priority:
      seed.priority ??
      analysis.priority,

    status:
      seed.status ??
      "Reported",

    supporters:
      seed.supporters ?? 1,

    photo:
      seed.photo ?? null,

    reportedAt,

    department,

    summary: analysis.summary,

    recommendation:
      seed.priority === "High" ||
      analysis.priority === "High"
        ? analysis.recommendation
        : CATEGORIES[
            seed.category
          ]?.action ||
          CATEGORIES.other.action,

    updates: buildUpdates(
      seed.status ?? "Reported",
      reportedAt,
      department
    )
  };
}

function getIssue(id) {
  return issues.find(
    (i) => i.id === id
  );
}

function statusCounts() {
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, 0])
  );

  issues.forEach(
    (i) => counts[i.status]++
  );

  return counts;
}


/* =========================================================
   5. SCREEN SWITCHING
   ========================================================= */

const SCREEN_HASH = {
  homeScreen: "home",
  reportScreen: "report",
  issuesScreen: "issues",
  communityScreen: "community",
  actionsScreen: "actions",
  createActivityScreen: "create-activity",
  actionDetailScreen: "action-detail",
  dashboardScreen: "dashboard",
  pwdIntelligenceScreen: "pwd-intelligence"
};

const SCREEN_TITLE = {
  homeScreen:
    "Civic OS — Report. Connect. Resolve.",

  reportScreen:
    "Report a problem · Civic OS",

  issuesScreen:
    "Civic issues · Civic OS",

  communityScreen:
    "Civic community · Civic OS",

  actionsScreen:
    "Civic Actions · Civic OS",

  createActivityScreen: 
    "Civic OS — Create Activity",

  actionDetailScreen:
    "Civic Action · Civic OS",

  dashboardScreen:
    "Civic dashboard · Civic OS",

  pwdIntelligenceScreen:
    "PWD road intelligence · Civic OS"
};

function screenFromHash() {
  const hash =
    location.hash.replace("#", "");

  return (
    Object.keys(SCREEN_HASH).find(
      (id) =>
        SCREEN_HASH[id] === hash
    ) || "homeScreen"
  );
}

function showScreen(
  id,
  { push = true } = {}
) {
  if (!document.getElementById(id)) {
    id = "homeScreen";
  }

  const dialog =
    $("#issueDialog");

  if (
    dialog &&
    dialog.open
  ) {
    dialog.close();
  }

  state.screen = id;

  $$(".screen").forEach(
    (screen) => {
      screen.classList.toggle(
        "active",
        screen.id === id
      );
    }
  );

  $$("[data-nav]").forEach(
    (btn) => {
      const isActive =
        btn.dataset.goto === id;

      btn.classList.toggle(
        "active",
        isActive
      );

      if (isActive) {
        btn.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        btn.removeAttribute(
          "aria-current"
        );
      }
    }
  );

  renderScreen(id);

  document.title =
    SCREEN_TITLE[id] ||
    "Civic OS — Report. Connect. Resolve.";

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  const hashName =
    SCREEN_HASH[id];

  if (hashName) {
    const hash =
      "#" + hashName;

    if (
      push &&
      location.hash !== hash
    ) {
      history.pushState(
        { screen: id },
        "",
        hash
      );
    }
  }
}

function renderScreen(id) {
  if (id === "homeScreen") {
    renderHome();
  }

  if (id === "reportScreen") {
    updateStepper();
  }

  if (id === "issuesScreen") {
    renderIssues();
  }

  if (id === "dashboardScreen") {
    renderDashboard();
  }

  if (id === "pwdIntelligenceScreen") {
    renderPwdIntelligence();
  }

  if (id === "communityScreen") {
    renderCommunity();
  }

  if (id === "actionsScreen") {
    renderCivicActions();
  }

  refreshIcons();
}


/* =========================================================
   6. HOME
   ========================================================= */

function renderHome() {
  const latest =
    [...issues].sort(
      (a, b) =>
        b.reportedAt -
        a.reportedAt
    )[0];

  if (!latest) return;

  const cat =
    CATEGORIES[latest.category] ||
    CATEGORIES.other;

  const stepIndex =
    STATUSES.indexOf(
      latest.status
    );

  const heroSignal =
    $("#heroSignal");

  if (heroSignal) {
    heroSignal.innerHTML = `
      <div class="signal-head">
        <span class="signal-live">
          <span
            class="pulse-dot"
            aria-hidden="true"
          ></span>
          Live civic signal
        </span>

        <span class="signal-id">
          ${escapeHtml(latest.id)}
        </span>
      </div>

      <p class="kicker">
        ${escapeHtml(cat.aiLabel)}
        ·
        ${timeAgo(latest.reportedAt)}
      </p>

      <h3 class="signal-title">
        ${escapeHtml(latest.title)}
      </h3>

      <p class="signal-loc">
        <i data-lucide="map-pin"></i>
        ${escapeHtml(latest.location)}
      </p>

      <div class="tag-row">
        ${priorityPill(latest.priority)}
        ${statusPill(latest.status)}
      </div>

      <div class="signal-ai">
        <span class="signal-ai-label">
          <i data-lucide="sparkles"></i>
          Civic AI recommendation
        </span>

        <p>
          ${escapeHtml(
            latest.recommendation
          )}
        </p>
      </div>

      <ol
        class="pipeline"
        aria-label="Issue progress"
      >
        ${STATUSES.map(
          (s, i) => `
            <li
              class="pipeline-step
              ${i <= stepIndex ? "done" : ""}
              ${i === stepIndex ? "current" : ""}"
            >
              ${escapeHtml(s)}
            </li>
          `
        ).join("")}
      </ol>

      <div class="signal-foot">
        <span class="signal-dept">
          <i data-lucide="building-2"></i>
          ${escapeHtml(
            latest.department
          )}
        </span>

        <button
          type="button"
          class="link-btn"
          data-issue="${escapeHtml(
            latest.id
          )}"
        >
          View report
          <i data-lucide="arrow-right"></i>
        </button>
      </div>
    `;
  }

  const counts =
    statusCounts();

  const awaiting =
    counts.Reported +
    counts.Verified;

  const homeStats =
    $("#homeStats");

  if (homeStats) {
    homeStats.innerHTML = [
      {
        value: issues.length,
        label: "Total reports"
      },
      {
        value: counts.Resolved,
        label: "Issues resolved",
        accent: true
      },
      {
        value:
          counts["In Progress"],
        label: "In progress"
      },
      {
        value: awaiting,
        label: "Awaiting action"
      }
    ]
      .map(
        (s) => `
          <div
            class="stat glass ${
              s.accent
                ? "stat-accent"
                : ""
            }"
          >
            <div class="stat-value">
              ${s.value}
            </div>

            <div class="stat-label">
              ${escapeHtml(s.label)}
            </div>
          </div>
        `
      )
      .join("");
  }

  const recent =
    $("#recentIssues");

  if (recent) {
    recent.innerHTML =
      [...issues]
        .sort(
          (a, b) =>
            b.reportedAt -
            a.reportedAt
        )
        .slice(0, 3)
        .map(issueCard)
        .join("");
  }

  const openMissions =
    MISSIONS.filter(
      (m) =>
        m.joined < m.needed
    ).length;

  const teaser =
    $("#communityTeaser");

  if (teaser) {
    teaser.innerHTML = `
      <div>
        <p class="kicker">
          Connect
        </p>

        <h2
          id="teaserTitle"
          class="teaser-title"
        >
          Your skills can fix your city.
        </h2>

        <p class="teaser-sub">
          Students, designers, technicians
          and volunteers matched to real
          civic problems.
        </p>
      </div>

      <div class="teaser-meta">
        <div
          class="avatar-stack"
          aria-hidden="true"
        >
          ${PEOPLE.slice(0, 5)
            .map(
              (p, i) => `
                <span
                  class="avatar tone-${i % 4}"
                >
                  ${initials(p.name)}
                </span>
              `
            )
            .join("")}
        </div>

        <span class="muted-text">
          ${PEOPLE.length}
          contributors ·
          ${openMissions}
          open missions
        </span>

        <button
          type="button"
          class="btn btn-ghost"
          data-goto="communityScreen"
        >
          Find a mission
          <i data-lucide="arrow-right"></i>
        </button>
      </div>
    `;
  }

  refreshIcons();
}

function issueCard(issue) {
  const cat =
    CATEGORIES[issue.category] ||
    CATEGORIES.other;

  const iconTone =
    issue.status === "Resolved"
      ? "is-resolved"
      : issue.priority === "High"
        ? "is-high"
        : "";

  return `
    <button
      type="button"
      class="issue-card glass"
      data-issue="${escapeHtml(issue.id)}"
    >
      <span
        class="issue-icon ${iconTone}"
        aria-hidden="true"
      >
        <i data-lucide="${cat.icon}"></i>
      </span>

      <span class="issue-main">

        <span class="issue-top">
          <span>${escapeHtml(issue.id)}</span>
          <span aria-hidden="true">·</span>
          <span>${timeAgo(issue.reportedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(cat.label)}</span>
        </span>

        <span class="issue-title">
          ${escapeHtml(issue.title)}
        </span>

        <span class="issue-meta">
          <span>
            <i data-lucide="map-pin"></i>
            ${escapeHtml(issue.location)}
          </span>

          <span>
            <i data-lucide="building-2"></i>
            ${escapeHtml(issue.department)}
          </span>
        </span>

        <span class="issue-tags">
          ${statusPill(issue.status)}
          ${priorityPill(issue.priority)}

          <span class="pill">
            <i data-lucide="users"></i>
            ${issue.supporters}
            <span class="sr-only">
              supporters
            </span>
          </span>
        </span>

      </span>

      <i
        data-lucide="chevron-right"
        class="issue-chevron"
      ></i>
    </button>
  `;
}


/* =========================================================
   7. REPORT FLOW
   ========================================================= */

function renderCategoryOptions() {
  const grid =
    $("#categoryGrid");

  if (!grid) return;

  grid.innerHTML =
    Object.entries(CATEGORIES)
      .map(
        ([key, cat]) => `
          <div class="cat-option">

            <input
              type="radio"
              name="category"
              id="cat-${key}"
              value="${key}"
            />

            <label
              for="cat-${key}"
              class="cat-card"
            >
              <i data-lucide="${cat.icon}"></i>
              ${escapeHtml(cat.label)}
            </label>

          </div>
        `
      )
      .join("");

  refreshIcons();
}

function getDraft() {
  const form =
    $("#reportForm");

  if (!form) {
    return {
      categoryKey: null,
      description: "",
      location: "",
      hasPhoto: false
    };
  }

  const checked =
    form.querySelector(
      'input[name="category"]:checked'
    );

  return {
    categoryKey:
      checked
        ? checked.value
        : null,

    description:
      $("#description")?.value.trim() ||
      "",

    location:
      $("#location")?.value.trim() ||
      "",

    hasPhoto:
      Boolean(
        state.draftPhotoUrl
      ),

    isRoadReport:
      checked?.value === "roads"
  };
}

function updateStepper() {
  const form =
    $("#reportForm");

  const stepper =
    $("#reportStepper");

  if (!form || !stepper) return;

  const draft =
    getDraft();

  const submitted =
    form.hidden;

  const done = {
    category:
      Boolean(
        draft.categoryKey
      ) || submitted,

    details:
      (
        draft.description.length >=
          10 &&
        draft.location.length >=
          3
      ) || submitted,

    analyze:
      Boolean(
        state.analysis
      ) || submitted,

    submit:
      submitted
  };

  let currentMarked =
    false;

  $$("#reportStepper li")
    .forEach((li) => {
      const isDone =
        done[li.dataset.step];

      li.classList.toggle(
        "done",
        isDone
      );

      const isCurrent =
        !isDone &&
        !currentMarked;

      li.classList.toggle(
        "current",
        isCurrent
      );

      if (isCurrent) {
        currentMarked = true;

        li.setAttribute(
          "aria-current",
          "step"
        );
      } else {
        li.removeAttribute(
          "aria-current"
        );
      }
    });
}

function showFormError(
  message
) {
  const el =
    $("#formError");

  if (!el) return;

  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }

  el.innerHTML = `
    <i data-lucide="triangle-alert"></i>
    <span>
      ${escapeHtml(message)}
    </span>
  `;

  el.hidden = false;

  refreshIcons();
}

function invalidateAnalysis() {
  if (
    !state.analysis &&
    !state.analyzing
  ) {
    return;
  }

  state.analysis = null;

  const panel =
    $("#aiPanel");

  if (panel) {
    panel.innerHTML = "";
  }
}

function handleAnalyze(event) {
  event.preventDefault();

  if (state.analyzing) return;

  const draft =
    getDraft();

  const descEl =
    $("#description");

  const locEl =
    $("#location");

  if (!descEl || !locEl) return;

  descEl.removeAttribute(
    "aria-invalid"
  );

  locEl.removeAttribute(
    "aria-invalid"
  );

  if (
    draft.description.length <
    10
  ) {
    descEl.setAttribute(
      "aria-invalid",
      "true"
    );

    showFormError(
      "Please describe the problem in at least a few words."
    );

    descEl.focus();

    return;
  }

  if (
    draft.location.length <
    3
  ) {
    locEl.setAttribute(
      "aria-invalid",
      "true"
    );

    showFormError(
      "Please add a location so the right team can find it."
    );

    locEl.focus();

    return;
  }

  if (
    draft.isRoadReport &&
    !draft.hasPhoto
  ) {
    showFormError(
      "For PWD road reporting, please add a road photo before AI analysis."
    );

    document
      .getElementById("photo")
      ?.focus();

    return;
  }

  showFormError(null);

  state.draft = draft;
  state.analyzing = true;

  const analyzeBtn =
    $("#analyzeBtn");

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
  }

  const steps = [
    "Reading your description",
    "Detecting the issue category",
    "Assessing priority and risk",
    "Routing to a department",
    "Checking for duplicate reports"
  ];

  const panel =
    $("#aiPanel");

  if (!panel) return;

  panel.innerHTML = `
    <div class="ai-card is-loading">

      <div class="ai-head">
        <span class="ai-title">
          <i data-lucide="brain-circuit"></i>
          Civic AI is analyzing…
        </span>

        <span class="demo-badge">
          Demo AI
        </span>
      </div>

      <ol class="ai-steps">
        ${steps
          .map(
            (s) => `
              <li class="ai-step">
                <span class="ai-step-icon">
                  <i data-lucide="loader-circle"></i>
                </span>
                ${escapeHtml(s)}
              </li>
            `
          )
          .join("")}
      </ol>

    </div>
  `;

  refreshIcons();

  panel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  const stepEls =
    $$(".ai-step", panel);

  let index = 0;

  const tick = () => {
    stepEls.forEach(
      (el, i) => {
        el.classList.toggle(
          "done",
          i < index
        );

        el.classList.toggle(
          "active",
          i === index
        );
      }
    );

    if (
      index <
      stepEls.length
    ) {
      index++;

      setTimeout(
        tick,
        380
      );

      return;
    }

    state.analysis =
      analyzeReport(draft);

    state.analyzing = false;

    if (analyzeBtn) {
      analyzeBtn.disabled =
        false;
    }

    renderAnalysis();
  };

  tick();
}

function renderAnalysis() {
  const a =
    state.analysis;

  const d =
    state.draft;

  const panel =
    $("#aiPanel");

  if (!a || !d || !panel) {
    return;
  }

  const note =
    a.autoDetected
      ? `
        <div class="ai-note">
          <i data-lucide="sparkles"></i>
          <span>
            Civic AI detected the category
            <strong>
              ${escapeHtml(
                a.categoryLabel
              )}
            </strong>
            from your description.
          </span>
        </div>
      `
      : a.suggestion
        ? `
          <div class="ai-note">
            <i data-lucide="sparkles"></i>
            <span>
              Your description sounds more like
              <strong>
                ${escapeHtml(
                  CATEGORIES[
                    a.suggestion
                  ].label
                )}
              </strong>.

              <button
                type="button"
                class="link-btn"
                data-action="use-suggestion"
                data-key="${escapeHtml(
                  a.suggestion
                )}"
              >
                Switch category
              </button>
            </span>
          </div>
        `
        : "";

  const duplicate =
    a.duplicate
      ? `
        <div class="ai-warning">

          <i data-lucide="copy-check"></i>

          <div class="ai-warning-body">

            <span>
              <strong>
                Possible duplicate:
              </strong>

              ${escapeHtml(
                a.duplicate.id
              )}

              ·

              ${escapeHtml(
                a.duplicate.title
              )}

              (${a.duplicate.supporters}
              supporters,
              ${escapeHtml(
                a.duplicate.status.toLowerCase()
              )}).
            </span>

            <span>

              <button
                type="button"
                class="link-btn"
                data-action="support-duplicate"
                data-id="${escapeHtml(
                  a.duplicate.id
                )}"
              >
                Support existing report instead
                <i data-lucide="arrow-right"></i>
              </button>

            </span>

          </div>
        </div>
      `
      : "";

  const signals =
    a.signals.length
      ? `
        <div class="ai-cell wide">

          <span class="ai-label">
            Risk signals detected
          </span>

          <div class="signal-list">

            ${a.signals
              .map(
                (s) => `
                  <span class="pill pill-high">
                    ${escapeHtml(s)}
                  </span>
                `
              )
              .join("")}

          </div>
        </div>
      `
      : "";

  panel.innerHTML = `
    <div class="ai-card">

      <div class="ai-head">

        <span class="ai-title">
          <i data-lucide="brain-circuit"></i>
          Civic AI analysis
        </span>

        <span class="demo-badge">
          Demo AI
        </span>

      </div>

      ${note}

      <div class="ai-grid">

        <div class="ai-cell">
          <span class="ai-label">
            Issue category
          </span>

          <span class="ai-value">
            ${escapeHtml(
              a.categoryLabel
            )}
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            Priority
          </span>

          <span
            class="ai-value is-${a.priority.toLowerCase()}"
          >
            ${escapeHtml(
              a.priority
            )}
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            Responsible authority
          </span>

          <span class="ai-value">
            ${escapeHtml(
              a.authority || a.department
            )}
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            PWD division routing
          </span>

          <span class="ai-value">
            ${escapeHtml(
              a.division || "Department routing"
            )}
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            Routing confidence
          </span>

          <span class="ai-value">
            ${a.routingConfidence || 70}%
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            Suggested department
          </span>

          <span class="ai-value">
            ${escapeHtml(
              a.department
            )}
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            Location
          </span>

          <span class="ai-value">
            ${escapeHtml(
              d.location
            )}
          </span>
        </div>

        <div class="ai-cell">
          <span class="ai-label">
            Target response
          </span>

          <span class="ai-value">
            ${escapeHtml(
              a.responseTime
            )}
          </span>
        </div>

        <div class="ai-cell">

          <span class="ai-label">
            Confidence
          </span>

          <div class="confidence">

            <span class="ai-value">
              ${a.confidence}%
            </span>

            <span class="confidence-track">

              <span
                class="confidence-fill"
                style="display:block;width:${a.confidence}%"
              ></span>

            </span>

          </div>

        </div>

        <div class="ai-cell wide">

          <span class="ai-label">
            AI summary
          </span>

          <p class="ai-text">
            ${escapeHtml(
              a.summary
            )}
          </p>

        </div>

        ${signals}

        ${a.roadIntelligence ? `
          <div class="ai-cell wide">
            <span class="ai-label">
              <i data-lucide="scan-line"></i>
              Road vision analysis · Demo AI
            </span>
            <p class="ai-text">
              Defect detected: <strong>${escapeHtml(a.roadIntelligence.defect)}</strong>.
              Severity: <strong>${escapeHtml(a.roadIntelligence.severity)}</strong>.
              ${a.roadIntelligence.additionalDefects.length
                ? `Additional visible signals: ${escapeHtml(a.roadIntelligence.additionalDefects.join(", "))}.`
                : "The MVP currently uses the report description to demonstrate the vision-analysis workflow; a trained computer-vision model would replace this layer in production."}
            </p>
          </div>
        ` : ""}

      </div>

      <div class="ai-reco">

        <span class="ai-label">
          <i data-lucide="sparkles"></i>
          AI recommendation
        </span>

        <p class="ai-text">
          ${escapeHtml(
            a.recommendation
          )}
        </p>

      </div>

      ${duplicate}

      <div class="ai-actions">

        <button
          type="button"
          class="btn btn-primary btn-lg"
          data-action="submit-report"
        >
          <i data-lucide="send"></i>
          Submit report
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-lg"
          data-action="edit-report"
        >
          Edit details
        </button>

      </div>

    </div>
  `;

  refreshIcons();

  updateStepper();
}

function submitReport() {
  const a =
    state.analysis;

  const d =
    state.draft;

  if (!a || !d) return;

  const id =
    `CIV-${nextIssueNumber++}`;

  const issue =
    createIssue({
      id,

      title:
        makeTitle(
          d.description
        ),

      category:
        a.categoryKey,

      description:
        d.description,

      location:
        d.location,

      area:
        "Citizen report",

      priority:
        a.priority,

      status:
        "Reported",

      supporters:
        1,

      photo:
        state.draftPhotoUrl,

      reportedAt:
        Date.now()
    });

  issue.summary =
    a.summary;

  issue.recommendation =
    a.recommendation;

  issues.unshift(issue);

  state.supported.add(id);

  const oldPhoto =
    state.draftPhotoUrl;

  state.draftPhotoUrl =
    null;

  resetReportForm();

  if (oldPhoto) {
    try {
      URL.revokeObjectURL(
        oldPhoto
      );
    } catch {}
  }

  const reportForm =
    $("#reportForm");

  if (reportForm) {
    reportForm.hidden =
      true;
  }

  state.analysis =
    null;

  const panel =
    $("#aiPanel");

  if (panel) {
    panel.innerHTML = `
      <div class="ai-card success-card">

        <span class="success-icon">
          <i data-lucide="check"></i>
        </span>

        <p class="kicker">
          ${escapeHtml(id)}
          ·
          ${escapeHtml(
            issue.authority || issue.department
          )}
        </p>

        <h3 class="success-title">
          Report submitted
        </h3>

        <p class="success-sub">
          Your report is now live.
          ${escapeHtml(
            issue.authority || issue.department
          )}
          is the recommended authority and
          you will see every status
          update here.
        </p>

        <div class="success-actions">

          <button
            type="button"
            class="btn btn-primary"
            data-issue="${escapeHtml(id)}"
          >
            <i data-lucide="activity"></i>
            Track this issue
          </button>

          <button
            type="button"
            class="btn btn-ghost"
            data-action="report-another"
          >
            Report another
          </button>

        </div>

      </div>
    `;

    refreshIcons();
  }

  updateStepper();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  toast(
    `${id} routed to ${issue.authority || issue.department}`
  );
}

function resetReportForm() {
  const form =
    $("#reportForm");

  if (!form) return;

  form.reset();

  clearPhoto({
    revoke: Boolean(
      state.draftPhotoUrl
    )
  });

  const count =
    $("#descCount");

  if (count) {
    count.textContent =
      "0 / 500";
  }

  showFormError(null);
}

function setPhoto(file) {
  if (!file) return;

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    toast(
      "Please choose an image file",
      "triangle-alert"
    );

    return;
  }

  clearPhoto({
    revoke: true
  });

  state.draftPhotoUrl =
    URL.createObjectURL(file);

  const photoImg =
    $("#photoImg");

  const preview =
    $("#photoPreview");

  const dropzone =
    $("#dropzone");

  if (photoImg) {
    photoImg.src =
      state.draftPhotoUrl;
  }

  if (preview) {
    preview.hidden = false;
  }

  if (dropzone) {
    dropzone.hidden = true;
  }

  invalidateAnalysis();
}

function clearPhoto({
  revoke
}) {
  if (
    revoke &&
    state.draftPhotoUrl
  ) {
    try {
      URL.revokeObjectURL(
        state.draftPhotoUrl
      );
    } catch {}
  }

  state.draftPhotoUrl =
    null;

  const photo =
    $("#photo");

  const photoImg =
    $("#photoImg");

  const preview =
    $("#photoPreview");

  const dropzone =
    $("#dropzone");

  if (photo) {
    photo.value = "";
  }

  if (photoImg) {
    photoImg.removeAttribute(
      "src"
    );
  }

  if (preview) {
    preview.hidden = true;
  }

  if (dropzone) {
    dropzone.hidden = false;
  }
}

function fillExample() {
  const example =
    EXAMPLES[
      state.exampleIndex %
        EXAMPLES.length
    ];

  state.exampleIndex++;

  const radio =
    document.getElementById(
      `cat-${example.category}`
    );

  if (radio) {
    radio.checked = true;
  }

  const description =
    $("#description");

  const location =
    $("#location");

  const count =
    $("#descCount");

  if (description) {
    description.value =
      example.description;
  }

  if (location) {
    location.value =
      example.location;
  }

  if (count) {
    count.textContent =
      `${example.description.length} / 500`;
  }

  invalidateAnalysis();

  showFormError(null);

  updateStepper();
}

function useCurrentLocation() {
  const btn =
    $("#locateBtn");

  if (
    !("geolocation" in navigator)
  ) {
    toast(
      "Location is not available on this device",
      "triangle-alert"
    );

    return;
  }

  if (btn) {
    btn.disabled = true;

    const span =
      btn.querySelector("span");

    if (span) {
      span.textContent =
        "Locating…";
    }
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const location =
        $("#location");

      if (location) {
        location.value =
          `GPS ${pos.coords.latitude.toFixed(
            5
          )}, ${pos.coords.longitude.toFixed(
            5
          )}`;
      }

      if (btn) {
        btn.disabled = false;

        const span =
          btn.querySelector(
            "span"
          );

        if (span) {
          span.textContent =
            "Use my current location";
        }
      }

      invalidateAnalysis();

      updateStepper();

      toast(
        "Location added"
      );
    },

    () => {
      if (btn) {
        btn.disabled = false;

        const span =
          btn.querySelector(
            "span"
          );

        if (span) {
          span.textContent =
            "Use my current location";
        }
      }

      toast(
        "Couldn't get your location — please type it",
        "triangle-alert"
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 8000
    }
  );
}


/* =========================================================
   8. ISSUE EXPLORER + DETAIL SHEET
   ========================================================= */

function setupIssueFilters() {
  const category =
    $("#filterCategory");

  const chips =
    $("#statusChips");

  if (category) {
    category.innerHTML =
      `<option value="all">All categories</option>` +
      Object.entries(CATEGORIES)
        .map(
          ([key, cat]) =>
            `<option value="${key}">${escapeHtml(
              cat.label
            )}</option>`
        )
        .join("");
  }

  if (chips) {
    chips.innerHTML =
      ["All", ...STATUSES]
        .map(
          (s) => `
            <button
              type="button"
              class="chip"
              data-status-filter="${escapeHtml(s)}"
              aria-pressed="false"
            >
              ${escapeHtml(s)}
              <span class="chip-count"></span>
            </button>
          `
        )
        .join("");
  }
}

function syncFilterControls() {
  const f =
    state.filters;

  const category =
    $("#filterCategory");

  const priority =
    $("#filterPriority");

  const sort =
    $("#sortIssues");

  const search =
    $("#issueSearch");

  if (category) {
    category.value =
      f.category;
  }

  if (priority) {
    priority.value =
      f.priority;
  }

  if (sort) {
    sort.value =
      f.sort;
  }

  if (search) {
    search.value =
      f.query;
  }

  const counts =
    statusCounts();

  $$(
    "[data-status-filter]"
  ).forEach((chip) => {
    const s =
      chip.dataset.statusFilter;

    chip.setAttribute(
      "aria-pressed",
      String(
        s === f.status
      )
    );

    const count =
      chip.querySelector(
        ".chip-count"
      );

    if (count) {
      count.textContent =
        s === "All"
          ? issues.length
          : counts[s] || 0;
    }
  });
}

function getFilteredIssues() {
  const {
    status,
    category,
    priority,
    sort,
    query
  } = state.filters;

  const q =
    query.trim().toLowerCase();

  const list =
    issues.filter((i) => {
      if (
        status !== "All" &&
        i.status !== status
      ) {
        return false;
      }

      if (
        category !== "all" &&
        i.category !== category
      ) {
        return false;
      }

      if (
        priority !== "all" &&
        i.priority !== priority
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      const cat =
        CATEGORIES[i.category] ||
        CATEGORIES.other;

      return [
        i.id,
        i.title,
        i.location,
        i.area,
        i.department,
        i.description,
        cat.label
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

  if (sort === "priority") {
    list.sort(
      (a, b) =>
        PRIORITY_RANK[
          b.priority
        ] -
          PRIORITY_RANK[
            a.priority
          ] ||
        b.reportedAt -
          a.reportedAt
    );
  } else if (
    sort === "supported"
  ) {
    list.sort(
      (a, b) =>
        b.supporters -
        a.supporters
    );
  } else {
    list.sort(
      (a, b) =>
        b.reportedAt -
        a.reportedAt
    );
  }

  return list;
}

function renderIssues() {
  syncFilterControls();

  renderIssueList();
}

function renderIssueList() {
  const list =
    getFilteredIssues();

  const count =
    $("#issuesCount");

  const container =
    $("#issuesList");

  if (count) {
    count.textContent =
      `Showing ${list.length} of ${issues.length} reports. Tap any issue to see its AI analysis and progress.`;
  }

  if (!container) return;

  container.innerHTML =
    list.length
      ? list
          .map(issueCard)
          .join("")
      : `
        <div class="empty-state glass">

          <i data-lucide="scan-search"></i>

          <strong>
            No issues match these filters
          </strong>

          <span>
            Try a different status,
            category or search term.
          </span>

          <button
            type="button"
            class="btn btn-ghost btn-sm"
            data-action="clear-filters"
          >
            Clear filters
          </button>

        </div>
      `;

  refreshIcons();
}

function matchedHelpers(issue) {
  const skills =
    (
      CATEGORIES[
        issue.category
      ] ||
      CATEGORIES.other
    ).skills;

  return PEOPLE
    .map((p) => ({
      person: p,

      overlap:
        p.skills.filter(
          (s) =>
            skills.includes(s)
        )
    }))
    .filter(
      (m) =>
        m.overlap.length
    )
    .sort(
      (a, b) =>
        b.overlap.length -
        a.overlap.length
    )
    .slice(0, 3);
}

function openIssue(id) {
  const issue =
    getIssue(id);

  if (!issue) return;

  state.openIssueId =
    id;

  renderIssueSheet(issue);

  const dialog =
    $("#issueDialog");

  if (!dialog) return;

  if (!dialog.open) {
    dialog.showModal();
  }

  const inner =
    $(".sheet-inner");

  if (inner) {
    inner.scrollTop = 0;
  }
}

function renderIssueSheet(issue) {
  const cat =
    CATEGORIES[
      issue.category
    ] ||
    CATEGORIES.other;

  const stepIndex =
    STATUSES.indexOf(
      issue.status
    );

  const supported =
    state.supported.has(
      issue.id
    );

  const helpers =
    matchedHelpers(issue);

  const nextStatus =
    STATUSES[
      stepIndex + 1
    ];

  const body =
    $("#sheetBody");

  if (!body) return;

  body.innerHTML = `
    <div class="sheet-top">
      <span>${escapeHtml(issue.id)}</span>
      <span aria-hidden="true">·</span>
      <span>${timeAgo(issue.reportedAt)}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(issue.area)}</span>
    </div>

    <h3
      id="sheetTitle"
      class="sheet-title"
    >
      ${escapeHtml(issue.title)}
    </h3>

    <div class="sheet-meta">

      <span>
        <i data-lucide="${cat.icon}"></i>
        ${escapeHtml(cat.label)}
      </span>

      <span>
        <i data-lucide="map-pin"></i>
        ${escapeHtml(issue.location)}
      </span>

    </div>

    <div
      class="tag-row"
      style="margin:0 0 18px"
    >
      ${statusPill(issue.status)}
      ${priorityPill(issue.priority)}
    </div>

    ${
      issue.photo
        ? `
          <img
            class="sheet-photo"
            src="${issue.photo}"
            alt="Evidence photo for ${escapeHtml(
              issue.title
            )}"
          />
        `
        : ""
    }

    <p class="sheet-desc">
      ${escapeHtml(
        issue.description
      )}
    </p>

    <div class="sheet-section">

      <div class="sheet-section-title">
        <span>Progress</span>
        <span>
          ${stepIndex + 1}
          /
          ${STATUSES.length}
        </span>
      </div>

      <ol class="timeline">

        ${STATUSES.map(
          (s, i) => `
            <li
              class="tl-step
              ${i <= stepIndex ? "done" : ""}
              ${i === stepIndex ? "current" : ""}"
            >
              ${escapeHtml(s)}
            </li>
          `
        ).join("")}

      </ol>

    </div>

    <div class="sheet-section">

      <div class="sheet-section-title">

        <span>
          Civic AI analysis
        </span>

        <span class="demo-badge">
          Demo AI
        </span>

      </div>

      <div class="ai-grid">

        <div class="ai-cell">

          <span class="ai-label">
            Category
          </span>

          <span class="ai-value">
            ${escapeHtml(
              cat.aiLabel
            )}
          </span>

        </div>

        <div class="ai-cell">

          <span class="ai-label">
            Priority
          </span>

          <span
            class="ai-value is-${issue.priority.toLowerCase()}"
          >
            ${escapeHtml(
              issue.priority
            )}
          </span>

        </div>

        <div class="ai-cell wide">

          <span class="ai-label">
            Department
          </span>

          <span class="ai-value">
            ${escapeHtml(
              issue.department
            )}
          </span>

        </div>

        <div class="ai-cell wide">

          <span class="ai-label">
            Summary
          </span>

          <p class="ai-text">
            ${escapeHtml(
              issue.summary
            )}
          </p>

        </div>

      </div>

      <div class="ai-reco">

        <span class="ai-label">
          <i data-lucide="sparkles"></i>
          Recommendation
        </span>

        <p class="ai-text">
          ${escapeHtml(
            issue.recommendation
          )}
        </p>

      </div>

    </div>

    <div class="sheet-section">

      <div class="sheet-section-title">
        <span>
          Community activity
        </span>
      </div>

      <div class="support-box">

        <div>

          <div class="support-count">
            ${issue.supporters}
          </div>

          <div class="support-label">
            ${
              issue.supporters === 1
                ? "citizen is"
                : "citizens are"
            }
            affected by this
          </div>

        </div>

        <button
          type="button"
          class="btn ${
            supported
              ? "btn-ghost"
              : "btn-primary"
          } btn-sm"
          data-action="support"
          data-id="${escapeHtml(
            issue.id
          )}"
          aria-pressed="${supported}"
        >
          <i
            data-lucide="${
              supported
                ? "check"
                : "thumbs-up"
            }"
          ></i>

          ${
            supported
              ? "Supported"
              : "I'm affected too"
          }

        </button>

      </div>

    </div>

    ${
      helpers.length
        ? `
          <div class="sheet-section">

            <div class="sheet-section-title">

              <span>
                People who could help
              </span>

              <button
                type="button"
                class="link-btn"
                data-goto="communityScreen"
              >
                Community
                <i data-lucide="arrow-right"></i>
              </button>

            </div>

            <div class="helpers">

              ${helpers
                .map(
                  (h, i) => `
                    <div class="helper">

                      <span
                        class="avatar tone-${i % 4}
                        ${
                          h.person.org
                            ? "is-org"
                            : ""
                        }"
                        aria-hidden="true"
                      >
                        ${initials(
                          h.person.name
                        )}
                      </span>

                      <span class="helper-text">

                        <span>
                          ${escapeHtml(
                            h.person.name
                          )}
                        </span>

                        <small>
                          ${h.overlap
                            .map(
                              escapeHtml
                            )
                            .join(
                              " · "
                            )}
                        </small>

                      </span>

                    </div>
                  `
                )
                .join("")}

            </div>
          </div>
        `
        : ""
    }

    <div class="sheet-section">

      <div class="sheet-section-title">
        <span>Updates</span>
      </div>

      <ol class="updates">

        ${[
          ...issue.updates
        ]
          .reverse()
          .map(
            (u) => `
              <li class="update">

                <span
                  class="update-dot"
                  aria-hidden="true"
                ></span>

                <div>

                  <div class="update-head">
                    ${escapeHtml(
                      u.status
                    )}

                    <span class="update-time">
                      ${timeAgo(
                        u.time
                      )}
                    </span>
                  </div>

                  <p class="update-note">
                    ${escapeHtml(
                      u.note
                    )}
                  </p>

                </div>

              </li>
            `
          )
          .join("")}

      </ol>

    </div>

    <div class="sheet-section">

      <div class="official-box">

        <div class="sheet-section-title">
          <span>
            Governance demo control
          </span>
        </div>

        <p>
          For the presentation:
          act as
          ${escapeHtml(
            issue.department
          )}
          and move this issue
          through its lifecycle.
        </p>

        ${
          nextStatus
            ? `
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                data-action="advance"
                data-id="${escapeHtml(
                  issue.id
                )}"
              >
                <i data-lucide="arrow-right"></i>
                Mark as
                ${escapeHtml(
                  nextStatus
                )}
              </button>
            `
            : `
              <span class="pill status-resolved">
                <i data-lucide="badge-check"></i>
                Fully resolved
              </span>
            `
        }

      </div>

    </div>
  `;

  refreshIcons();
}

function advanceIssue(id) {
  const issue =
    getIssue(id);

  if (!issue) return;

  const index =
    STATUSES.indexOf(
      issue.status
    );

  if (
    index <
      0 ||
    index >=
      STATUSES.length - 1
  ) {
    return;
  }

  const next =
    STATUSES[index + 1];

  const notes = {
    Verified:
      "Verified by the ward officer after a site check.",

    "In Progress":
      `${issue.department} team assigned and work scheduled.`,

    Resolved:
      "Work completed and issue closed."
  };

  issue.status =
    next;

  issue.updates.push({
    status: next,
    note: notes[next],
    time: Date.now()
  });

  renderIssueSheet(issue);

  renderScreen(
    state.screen
  );

  toast(
    next === "Resolved"
      ? `${issue.id} resolved`
      : `${issue.id} marked as ${next}`,
    next === "Resolved"
      ? "badge-check"
      : "circle-check"
  );
}

function toggleSupport(id) {
  const issue =
    getIssue(id);

  if (!issue) return;

  if (
    state.supported.has(id)
  ) {
    state.supported.delete(id);

    issue.supporters =
      Math.max(
        0,
        issue.supporters - 1
      );
  } else {
    state.supported.add(id);

    issue.supporters++;

    toast(
      "Thanks — your support raises this issue's visibility"
    );
  }

  renderIssueSheet(issue);

  renderScreen(
    state.screen
  );
}


/* =========================================================
   9A. PWD ROAD INTELLIGENCE
   ========================================================= */

function calculateRoadPriority(issue) {
  if (!issue || issue.category !== "roads") return 0;

  const text = `${issue.description || ""} ${issue.location || ""}`.toLowerCase();

  const severityScore = {
    High: 40,
    Medium: 25,
    Low: 10
  }[issue.priority] || 15;

  const reportScore = Math.min(
    25,
    Math.max(5, (issue.supporters || 1) * 3)
  );

  const trafficScore = /traffic|vehicles|cars|bus|school|market|hospital|main road|highway/i.test(text)
    ? 15
    : 7;

  const connectivityScore = /main road|highway|bridge|junction|market|school|hospital|college|bus depot/i.test(text)
    ? 10
    : 5;

  const evidenceScore = issue.photo ? 5 : 0;

  return Math.min(
    100,
    severityScore +
      reportScore +
      trafficScore +
      connectivityScore +
      evidenceScore
  );
}

function getRoadPriorityReason(issue, score) {
  const reasons = [];

  if (issue.priority === "High") {
    reasons.push("high reported severity");
  }

  if ((issue.supporters || 0) >= 4) {
    reasons.push("multiple citizen reports/support");
  }

  const text = `${issue.description || ""} ${issue.location || ""}`.toLowerCase();

  if (/traffic|vehicles|cars|bus|school|market|hospital|main road|highway/i.test(text)) {
    reasons.push("potential traffic or public-access impact");
  }

  if (/main road|highway|bridge|junction|market|school|hospital|college|bus depot/i.test(text)) {
    reasons.push("important connectivity/public location");
  }

  if (issue.photo) {
    reasons.push("photo evidence available");
  }

  if (!reasons.length) {
    reasons.push("road condition requires field assessment");
  }

  return reasons;
}

function renderPwdIntelligence() {
  const body = $("#pwdIntelligenceBody");
  if (!body) return;

  const roads = issues
    .filter((i) => i.category === "roads")
    .map((issue) => ({
      issue,
      score: calculateRoadPriority(issue)
    }))
    .sort((a, b) => b.score - a.score);

  const high = roads.filter((r) => r.score >= 70).length;
  const medium = roads.filter((r) => r.score >= 45 && r.score < 70).length;
  const low = roads.filter((r) => r.score < 45).length;

  body.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi glass kpi-high">
        <span class="kpi-label"><i data-lucide="siren"></i> High priority roads</span>
        <span class="kpi-value">${high}</span>
        <span class="kpi-sub">Immediate review recommended</span>
      </div>
      <div class="kpi glass">
        <span class="kpi-label"><i data-lucide="traffic-cone"></i> Medium priority</span>
        <span class="kpi-value">${medium}</span>
        <span class="kpi-sub">Schedule field inspection</span>
      </div>
      <div class="kpi glass kpi-resolved">
        <span class="kpi-label"><i data-lucide="check-circle-2"></i> Lower priority</span>
        <span class="kpi-value">${low}</span>
        <span class="kpi-sub">Monitor and verify</span>
      </div>
      <div class="kpi glass">
        <span class="kpi-label"><i data-lucide="map"></i> Road reports</span>
        <span class="kpi-value">${roads.length}</span>
        <span class="kpi-sub">Citizen-submitted evidence</span>
      </div>
    </div>

    <section class="panel glass" style="margin-top:18px;">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">AI maintenance priority queue</h3>
          <p class="panel-sub">Explainable MVP score — not a trained predictive model.</p>
        </div>
        <span class="demo-badge">PWD-03 · MVP</span>
      </div>

      <div style="display:grid;gap:12px;">
        ${roads.length ? roads.map((r, index) => {
          const issue = r.issue;
          const reasons = getRoadPriorityReason(issue, r.score);
          const tone = r.score >= 70 ? "pill-high" : r.score >= 45 ? "pill-medium" : "pill-low";
          return `
            <button type="button" class="issue-card glass" data-issue="${escapeHtml(issue.id)}" style="width:100%;text-align:left;">
              <span class="issue-icon ${r.score >= 70 ? "is-high" : ""}" aria-hidden="true">
                <i data-lucide="road"></i>
              </span>
              <span class="issue-main">
                <span class="issue-top">
                  <span>#${index + 1}</span><span aria-hidden="true">·</span>
                  <span>${escapeHtml(issue.id)}</span><span aria-hidden="true">·</span>
                  <span>${escapeHtml(issue.location)}</span>
                </span>
                <span class="issue-title">${escapeHtml(issue.title)}</span>
                <span class="issue-meta">
                  <span><i data-lucide="building-2"></i>${escapeHtml(issue.authority || "Manipur PWD")}</span>
                  <span><i data-lucide="map-pin"></i>${escapeHtml(issue.division || "PWD jurisdiction review")}</span>
                </span>
                <span class="issue-tags">
                  <span class="pill ${tone}">Priority score ${r.score}/100</span>
                  <span class="pill">${issue.supporters} report/support signal</span>
                </span>
                <span class="muted-text" style="display:block;margin-top:8px;">
                  ${escapeHtml(reasons.slice(0,3).join(" · "))}
                </span>
              </span>
              <i data-lucide="chevron-right" class="issue-chevron"></i>
            </button>
          `;
        }).join("") : `
          <div class="empty-state">
            <i data-lucide="road"></i>
            <strong>No road reports yet</strong>
            <span>Submit a road photo from Report a problem to populate this queue.</span>
          </div>
        `}
      </div>
    </section>

    <section class="panel glass" style="margin-top:18px;">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">AI inspection recommendation</h3>
          <p class="panel-sub">The system explains why a road should be reviewed.</p>
        </div>
        <i data-lucide="brain-circuit" style="color:var(--accent)"></i>
      </div>
      <div class="insight-card">
        <span class="action-icon"><i data-lucide="scan-line"></i></span>
        <div>
          <p class="insight-title">
            ${roads.length
              ? `Top priority: ${escapeHtml(roads[0].issue.location)} — ${roads[0].score}/100`
              : "Waiting for road evidence"}
          </p>
          <p class="insight-sub">
            ${roads.length
              ? escapeHtml(getRoadPriorityReason(roads[0].issue, roads[0].score).join(", ")) + ". Recommended next step: field inspection."
              : "Once a road report is submitted, the priority engine will rank it here."}
          </p>
        </div>
      </div>
    </section>
  `;

  refreshIcons();
}

/* =========================================================
   9. DASHBOARD
   ========================================================= */

function renderDashboard() {
  const body =
    $("#dashboardBody");

  if (!body) return;

  const total =
    issues.length;

  const counts =
    statusCounts();

  const open =
    issues.filter(
      (i) =>
        i.status !== "Resolved"
    );

  const awaiting =
    counts.Reported +
    counts.Verified;

  const highOpen =
    open.filter(
      (i) =>
        i.priority === "High"
    );

  const resolutionRate =
    total
      ? Math.round(
          (counts.Resolved /
            total) *
            100
        )
      : 0;

  const byCategory =
    Object.keys(CATEGORIES)
      .map((key) => ({
        key,
        count:
          issues.filter(
            (i) =>
              i.category ===
              key
          ).length
      }))
      .filter(
        (c) => c.count
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      );

  const maxCategory =
    byCategory[0]?.count ||
    1;

  const byDepartment = {};

  open.forEach((i) => {
    byDepartment[
      i.department
    ] =
      (byDepartment[
        i.department
      ] || 0) + 1;
  });

  const departments =
    Object.entries(
      byDepartment
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );

  const maxDept =
    departments[0]?.[1] ||
    1;

  const byArea = {};

  open.forEach((i) => {
    byArea[i.area] =
      byArea[i.area] || {
        count: 0,
        high: 0
      };

    byArea[i.area].count++;

    if (
      i.priority === "High"
    ) {
      byArea[i.area].high++;
    }
  });

  const hotspots =
    Object.entries(
      byArea
    )
      .sort(
        (a, b) =>
          b[1].count -
            a[1].count ||
          b[1].high -
            a[1].high
      )
      .slice(0, 4);

  const days = [];

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  for (
    let d = 6;
    d >= 0;
    d--
  ) {
    const start =
      today.getTime() -
      d * 24 * HOUR;

    const end =
      start + 24 * HOUR;

    const idx =
      6 - d;

    const reported =
      WEEKLY_BASELINE
        .reported[idx] +
      issues.filter(
        (i) =>
          i.reportedAt >=
            start &&
          i.reportedAt <
            end
      ).length;

    const resolved =
      WEEKLY_BASELINE
        .resolved[idx] +
      issues.filter(
        (i) =>
          i.updates.some(
            (u) =>
              u.status ===
                "Resolved" &&
              u.time >=
                start &&
              u.time <
                end
          )
      ).length;

    days.push({
      label:
        new Date(
          start
        )
          .toLocaleDateString(
            "en",
            {
              weekday:
                "short"
            }
          )
          .slice(0, 2),

      reported,

      resolved
    });
  }

  const maxDay =
    Math.max(
      ...days.map(
        (d) =>
          Math.max(
            d.reported,
            d.resolved
          )
      ),
      1
    );

  const topCategory =
    byCategory[0];

  const topShare =
    topCategory
      ? Math.round(
          (topCategory.count /
            total) *
            100
        )
      : 0;

  const topDept =
    departments[0];

  const topArea =
    hotspots[0];

  const statusColors = {
    Reported:
      "var(--st-reported)",

    Verified:
      "var(--st-verified)",

    "In Progress":
      "var(--st-progress)",

    Resolved:
      "var(--st-resolved)"
  };

  let cursor = 0;

  const donutStops =
    STATUSES.map(
      (s) => {
        const share =
          total
            ? (counts[s] /
                total) *
              100
            : 0;

        const stop =
          `${statusColors[s]} ${cursor}% ${
            cursor + share
          }%`;

        cursor += share;

        return stop;
      }
    ).join(", ");

  body.innerHTML = `
    <div class="kpi-grid">

      <button
        type="button"
        class="kpi glass"
        data-goto="issuesScreen"
        data-status="All"
      >
        <span class="kpi-label">
          <i data-lucide="flag"></i>
          Total reports
        </span>

        <span class="kpi-value">
          ${total}
        </span>

        <span class="kpi-sub">
          ${resolutionRate}% resolution rate
        </span>
      </button>

      <button
        type="button"
        class="kpi glass kpi-resolved"
        data-goto="issuesScreen"
        data-status="Resolved"
      >
        <span class="kpi-label">
          <i data-lucide="badge-check"></i>
          Resolved
        </span>

        <span class="kpi-value">
          ${counts.Resolved}
        </span>

        <span class="kpi-sub">
          Closed by departments
        </span>
      </button>

      <button
        type="button"
        class="kpi glass kpi-progress"
        data-goto="issuesScreen"
        data-status="In Progress"
      >
        <span class="kpi-label">
          <i data-lucide="activity"></i>
          In progress
        </span>

        <span class="kpi-value">
          ${counts["In Progress"]}
        </span>

        <span class="kpi-sub">
          Teams on site
        </span>
      </button>

      <button
        type="button"
        class="kpi glass"
        data-goto="issuesScreen"
        data-status="Reported"
      >
        <span class="kpi-label">
          <i data-lucide="clock"></i>
          Awaiting action
        </span>

        <span class="kpi-value">
          ${awaiting}
        </span>

        <span class="kpi-sub">
          Reported or verified
        </span>
      </button>

      <button
        type="button"
        class="kpi glass kpi-high"
        data-goto="issuesScreen"
        data-priority="High"
      >
        <span class="kpi-label">
          <i data-lucide="siren"></i>
          High priority
        </span>

        <span class="kpi-value">
          ${highOpen.length}
        </span>

        <span class="kpi-sub">
          Open and urgent
        </span>
      </button>

    </div>

    <div class="insight-card">

      <span class="action-icon">
        <i data-lucide="brain-circuit"></i>
      </span>

      <div>

        <p class="insight-title">
          Civic AI governance summary
          <span class="demo-badge">
            Demo AI
          </span>
        </p>

        <p class="insight-text">

          ${
            topCategory
              ? `
                <strong>
                  ${escapeHtml(
                    CATEGORIES[
                      topCategory.key
                    ].label
                  )}
                </strong>
                is the most reported category
                (${topShare}% of reports).
              `
              : ""
          }

          ${
            topDept
              ? `
                <strong>
                  ${escapeHtml(
                    topDept[0]
                  )}
                </strong>
                carries the largest open workload
                with ${topDept[1]} active issues.
              `
              : ""
          }

          ${
            topArea
              ? `
                <strong>
                  ${escapeHtml(
                    topArea[0]
                  )}
                </strong>
                is the current hotspot with
                ${topArea[1].count}
                open reports
                ${
                  topArea[1].high
                    ? `, ${topArea[1].high} of them high priority`
                    : ""
                }.
              `
              : ""
          }

          ${
            highOpen.length
              ? `
                Recommend prioritising the
                ${highOpen.length}
                high-priority issues within
                24 hours.
              `
              : "No urgent issues are open right now."
          }

        </p>

      </div>

    </div>

    <div class="dash-grid">

      <section
        class="panel glass"
        aria-labelledby="statusPanelTitle"
      >

        <div class="panel-head">

          <div>
            <h3
              id="statusPanelTitle"
              class="panel-title"
            >
              Status breakdown
            </h3>

            <p class="panel-sub">
              Where every report stands
            </p>
          </div>

        </div>

        <div class="donut-wrap">

          <div
            class="donut"
            style="background:conic-gradient(${donutStops})"
            role="img"
            aria-label="${STATUSES.map(
              (s) =>
                `${s}: ${counts[s]}`
            ).join(", ")}"
          >

            <div class="donut-center">

              <span class="donut-value">
                ${total}
              </span>

              <span class="donut-label">
                reports
              </span>

            </div>

          </div>

          <ul class="legend">

            ${STATUSES.map(
              (s) => `
                <li class="legend-item">

                  <span
                    class="legend-swatch"
                    style="background:${statusColors[s]}"
                  ></span>

                  ${escapeHtml(s)}

                  <span class="legend-value">
                    ${counts[s]}
                  </span>

                </li>
              `
            ).join("")}

          </ul>

        </div>

      </section>

      <section
        class="panel glass"
        aria-labelledby="weeklyPanelTitle"
      >

        <div class="panel-head">

          <div>

            <h3
              id="weeklyPanelTitle"
              class="panel-title"
            >
              Resolution activity
            </h3>

            <p class="panel-sub">
              City-wide, last 7 days
              (simulated baseline + live)
            </p>

          </div>

        </div>

        <div
          class="columns"
          role="img"
          aria-label="Reported versus resolved issues over the last 7 days"
        >

          ${days
            .map(
              (d) => `
                <div class="column">

                  <div class="column-bars">

                    <span
                      class="column-bar reported"
                      style="height:${
                        (d.reported /
                          maxDay) *
                        100
                      }%"
                    ></span>

                    <span
                      class="column-bar resolved"
                      style="height:${
                        (d.resolved /
                          maxDay) *
                        100
                      }%"
                    ></span>

                  </div>

                  <span class="column-label">
                    ${escapeHtml(
                      d.label
                    )}
                  </span>

                </div>
              `
            )
            .join("")}

        </div>

        <div
          class="chart-legend"
          style="margin-top:14px"
        >

          <span>
            <span
              class="legend-swatch"
              style="background:rgba(255,255,255,.2)"
            ></span>
            Reported
          </span>

          <span>
            <span
              class="legend-swatch"
              style="background:var(--accent)"
            ></span>
            Resolved
          </span>

        </div>

      </section>

      <section
        class="panel glass"
        aria-labelledby="catPanelTitle"
      >

        <div class="panel-head">

          <div>

            <h3
              id="catPanelTitle"
              class="panel-title"
            >
              Most common categories
            </h3>

            <p class="panel-sub">
              All reports by type
            </p>

          </div>

        </div>

        <div class="hbars">

          ${byCategory
            .map(
              (c) => `
                <div class="hbar-row">

                  <span class="hbar-label">

                    <i
                      data-lucide="${
                        CATEGORIES[
                          c.key
                        ].icon
                      }"
                    ></i>

                    ${escapeHtml(
                      CATEGORIES[
                        c.key
                      ].label
                    )}

                  </span>

                  <span class="hbar-value">
                    ${c.count}
                  </span>

                  <span class="hbar-track">

                    <span
                      class="hbar-fill"
                      style="display:block;width:${
                        (c.count /
                          maxCategory) *
                        100
                      }%"
                    ></span>

                  </span>

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <section
        class="panel glass"
        aria-labelledby="deptPanelTitle"
      >

        <div class="panel-head">

          <div>

            <h3
              id="deptPanelTitle"
              class="panel-title"
            >
              Department workload
            </h3>

            <p class="panel-sub">
              Open issues routed by Civic AI
            </p>

          </div>

        </div>

        <div class="hbars">

          ${departments
            .map(
              ([name, count]) => `
                <div class="hbar-row">

                  <span class="hbar-label">

                    <i data-lucide="building-2"></i>

                    ${escapeHtml(
                      name
                    )}

                  </span>

                  <span class="hbar-value">
                    ${count}
                  </span>

                  <span class="hbar-track">

                    <span
                      class="hbar-fill is-amber"
                      style="display:block;width:${
                        (count /
                          maxDept) *
                        100
                      }%"
                    ></span>

                  </span>

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <section
        class="panel glass"
        aria-labelledby="hotspotPanelTitle"
      >

        <div class="panel-head">

          <div>

            <h3
              id="hotspotPanelTitle"
              class="panel-title"
            >
              Civic hotspots
            </h3>

            <p class="panel-sub">
              Areas with the most open reports
            </p>

          </div>

          <i
            data-lucide="radar"
            style="color:var(--accent)"
          ></i>

        </div>

        <ol class="hotspots">

          ${hotspots
            .map(
              ([area, info], i) => `
                <li class="hotspot">

                  <span class="hotspot-rank">
                    0${i + 1}
                  </span>

                  <span class="hotspot-name">

                    ${escapeHtml(
                      area
                    )}

                    <small>
                      ${info.count}
                      open ·
                      ${info.high}
                      high priority
                    </small>

                  </span>

                  ${
                    info.high
                      ? `
                        <span class="pill pill-high">
                          Watch
                        </span>
                      `
                      : `
                        <span class="pill">
                          Stable
                        </span>
                      `
                  }

                </li>
              `
            )
            .join("")}

        </ol>

      </section>

      <section
        class="panel glass"
        aria-labelledby="urgentPanelTitle"
      >

        <div class="panel-head">

          <div>

            <h3
              id="urgentPanelTitle"
              class="panel-title"
            >
              Needs attention
            </h3>

            <p class="panel-sub">
              Open high-priority issues
            </p>

          </div>

        </div>

        <div class="priority-list">

          ${
            highOpen.length
              ? highOpen
                  .sort(
                    (a, b) =>
                      b.supporters -
                      a.supporters
                  )
                  .slice(0, 4)
                  .map(issueCard)
                  .join("")
              : `
                <div class="empty-state">

                  <i data-lucide="shield-check"></i>

                  <span>
                    No urgent issues open.
                  </span>

                </div>
              `
          }

        </div>

      </section>

    </div>
  `;

  refreshIcons();
}


/* =========================================================
   10. COMMUNITY MATCHING
   ========================================================= */

function renderSkillPicker() {
  const picker =
    $("#skillPicker");

  if (!picker) return;

  picker.innerHTML =
    SKILLS.map(
      (s) => `
        <button
          type="button"
          class="chip"
          data-skill="${escapeHtml(s)}"
          aria-pressed="${state.mySkills.has(s)}"
        >
          ${escapeHtml(s)}
        </button>
      `
    ).join("");
}

function syncSkillPicker() {
  $$("[data-skill]")
    .forEach(
      (chip) => {
        chip.setAttribute(
          "aria-pressed",
          String(
            state.mySkills.has(
              chip.dataset.skill
            )
          )
        );
      }
    );

  const count =
    $("#skillCount");

  if (count) {
    count.textContent =
      `${state.mySkills.size} selected`;
  }
}

function myMatch(mission) {
  if (
    !state.mySkills.size
  ) {
    return null;
  }

  const overlap =
    mission.skills.filter(
      (s) =>
        state.mySkills.has(s)
    ).length;

  return Math.round(
    (overlap /
      mission.skills.length) *
      100
  );
}

function topContributors(
  mission
) {
  return PEOPLE
    .map((p) => ({
      person: p,

      score:
        Math.round(
          (p.skills.filter(
            (s) =>
              mission.skills.includes(
                s
              )
          ).length /
            mission.skills.length) *
            100
        )
    }))
    .filter(
      (m) => m.score > 0
    )
    .sort(
      (a, b) =>
        b.score -
        a.score
    )
    .slice(0, 3);
}

function renderMissions() {
  const list =
    $("#missionList");

  if (!list) return;

  const missions =
    [...MISSIONS].sort(
      (a, b) =>
        (myMatch(b) ?? 0) -
        (myMatch(a) ?? 0)
    );

  list.innerHTML =
    missions
      .map(
        (m, index) => {
          const match =
            myMatch(m);

          const joined =
            state.joinedMissions.has(
              m.id
            );

          const contributors =
            topContributors(
              m
            );

          const badgeClass =
            match === null
              ? ""
              : match >= 67
                ? "is-strong"
                : match > 0
                  ? "is-partial"
                  : "";

          return `
            <article
              class="mission-card glass ${
                match &&
                index === 0
                  ? "is-top"
                  : ""
              }"
            >

              <div class="mission-head">

                <div>

                  <p class="mission-linked">

                    <i data-lucide="flag"></i>

                    Linked issue

                    <button
                      type="button"
                      class="link-btn"
                      data-issue="${escapeHtml(
                        m.issueId
                      )}"
                    >
                      ${escapeHtml(
                        m.issueId
                      )}
                    </button>

                  </p>

                  <h4 class="mission-title">
                    ${escapeHtml(
                      m.title
                    )}
                  </h4>

                </div>

                ${
                  match !== null
                    ? `
                      <span
                        class="match-badge ${badgeClass}"
                      >
                        ${match}% match
                      </span>
                    `
                    : ""
                }

              </div>

              <p class="mission-desc">
                ${escapeHtml(
                  m.description
                )}
              </p>

              <div
                class="skill-list"
                aria-label="Skills needed"
              >

                ${m.skills
                  .map(
                    (s) => `
                      <span
                        class="skill-chip ${
                          state.mySkills.has(
                            s
                          )
                            ? "have"
                            : ""
                        }"
                      >
                        ${
                          state.mySkills.has(
                            s
                          )
                            ? '<i data-lucide="check"></i>'
                            : ""
                        }

                        ${escapeHtml(s)}

                      </span>
                    `
                  )
                  .join("")}

              </div>

              <div class="mission-progress">

                <span
                  class="progress"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="${m.needed}"
                  aria-valuenow="${m.joined}"
                  aria-label="Volunteers joined"
                >
                  <span
                    style="width:${Math.min(
                      100,
                      (m.joined /
                        m.needed) *
                        100
                    )}%"
                  ></span>
                </span>

                <span>
                  ${m.joined}/${m.needed}
                  volunteers
                </span>

              </div>

              <div class="mission-foot">

                <div class="mission-matches">

                  <span
                    class="avatar-stack"
                    aria-hidden="true"
                  >

                    ${contributors
                      .map(
                        (c, i) => `
                          <span
                            class="avatar tone-${i % 4} ${
                              c.person.org
                                ? "is-org"
                                : ""
                            }"
                          >
                            ${initials(
                              c.person.name
                            )}
                          </span>
                        `
                      )
                      .join("")}

                  </span>

                  <span>
                    Matched:
                    ${contributors
                      .map(
                        (c) =>
                          `${escapeHtml(
                            c.person.name.split(
                              " "
                            )[0]
                          )} ${c.score}%`
                      )
                      .join(", ")}
                  </span>

                </div>

                <button
                  type="button"
                  class="btn btn-sm ${
                    joined
                      ? "btn-ghost"
                      : "btn-primary"
                  }"
                  data-action="join"
                  data-id="${escapeHtml(
                    m.id
                  )}"
                  aria-pressed="${joined}"
                >

                  <i
                    data-lucide="${
                      joined
                        ? "check"
                        : "user-plus"
                    }"
                  ></i>

                  ${
                    joined
                      ? "Joined"
                      : "Join mission"
                  }

                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");

  refreshIcons();
}

function renderPeople() {
  const grid =
    $("#peopleGrid");

  if (!grid) return;

  grid.innerHTML =
    PEOPLE.map(
      (p, i) => `
        <article class="person-card glass">

          <span
            class="avatar tone-${i % 4} ${
              p.org
                ? "is-org"
                : ""
            }"
            aria-hidden="true"
          >
            ${initials(p.name)}
          </span>

          <div class="person-body">

            <span class="person-name">

              ${escapeHtml(
                p.name
              )}

              ${
                p.org
                  ? '<span class="org-badge">Org</span>'
                  : ""
              }

            </span>

            <span class="person-role">

              ${escapeHtml(
                p.role
              )}

              ·

              ${escapeHtml(
                p.area
              )}

            </span>

            <div class="skill-list">

              ${p.skills
                .map(
                  (s) => `
                    <span
                      class="skill-chip ${
                        state.mySkills.has(
                          s
                        )
                          ? "have"
                          : ""
                      }"
                    >
                      ${escapeHtml(s)}
                    </span>
                  `
                )
                .join("")}

            </div>

          </div>

        </article>
      `
    ).join("");
}

function renderCommunity() {
  syncSkillPicker();

  renderMissions();

  renderPeople();
}

function toggleSkill(skill) {
  if (
    state.mySkills.has(
      skill
    )
  ) {
    state.mySkills.delete(
      skill
    );
  } else {
    state.mySkills.add(
      skill
    );
  }

  renderCommunity();

  refreshIcons();
}

function toggleMission(id) {
  const mission =
    MISSIONS.find(
      (m) => m.id === id
    );

  if (!mission) return;

  if (
    state.joinedMissions.has(
      id
    )
  ) {
    state.joinedMissions.delete(
      id
    );

    mission.joined =
      Math.max(
        0,
        mission.joined - 1
      );
  } else {
    state.joinedMissions.add(
      id
    );

    mission.joined++;

    toast(
      `You joined "${mission.title}"`,
      "hand-heart"
    );
  }

  renderMissions();
}


/* =========================================================
   11. CIVIC AI
   ========================================================= */

function getCivicAiContext() {
  if (state.openIssueId) {
    const issue =
      issues.find(
        (item) =>
          item.id ===
          state.openIssueId
      );

    if (issue) {
      return {
        title: issue.title,

        category:
          issue.category,

        description:
          issue.description,

        priority:
          issue.priority,

        status:
          issue.status,

        location:
          issue.location
      };
    }
  }

  if (state.draft) {
    return {
      title:
        state.draft.description?.slice(
          0,
          60
        ) ||
        "Current civic report",

      category:
        state.draft.categoryKey ||
        "other",

      description:
        state.draft.description ||
        "",

      location:
        state.draft.location ||
        ""
    };
  }

  return null;
}

function openCivicAi(
  context = null
) {
  state.civicAiOpen =
    true;

  state.civicAiContext =
    context ||
    getCivicAiContext();

  const panel =
    document.getElementById(
      "civicAiPanel"
    );

  const fab =
    document.getElementById(
      "civicAiFab"
    );

  if (!panel || !fab) {
    return;
  }

  panel.classList.add(
    "is-open"
  );

  panel.setAttribute(
    "aria-hidden",
    "false"
  );

  fab.setAttribute(
    "aria-expanded",
    "true"
  );

  refreshIcons();

  const input =
    document.getElementById(
      "civicAiInput"
    );

  if (input) {
    setTimeout(
      () => input.focus(),
      100
    );
  }
}

function closeCivicAi() {
  state.civicAiOpen =
    false;

  const panel =
    document.getElementById(
      "civicAiPanel"
    );

  const fab =
    document.getElementById(
      "civicAiFab"
    );

  if (!panel || !fab) {
    return;
  }

  panel.classList.remove(
    "is-open"
  );

  panel.setAttribute(
    "aria-hidden",
    "true"
  );

  fab.setAttribute(
    "aria-expanded",
    "false"
  );
}

function addCivicAiMessage(
  role,
  text
) {
  const container =
    document.getElementById(
      "civicAiMessages"
    );

  if (!container) return;

  state.civicAiMessages.push({
    role,
    text
  });

  const message =
    document.createElement(
      "div"
    );

  message.className =
    `civic-ai-message ${role}`;

  if (role === "ai") {
    message.innerHTML = `
      <div class="civic-ai-message-avatar">
        <i data-lucide="sparkles"></i>
      </div>

      <div class="civic-ai-bubble">
        ${text}
      </div>
    `;
  } else {
    message.innerHTML = `
      <div class="civic-ai-bubble">
        ${text}
      </div>
    `;
  }

  container.appendChild(
    message
  );

  container.scrollTop =
    container.scrollHeight;

  refreshIcons();
}

function civicAiText(value) {
  return String(value || "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function detectCivicCategory(
  text
) {
  const question =
    String(text || "")
      .toLowerCase();

  const keywords = {
    roads: [
      "road",
      "pothole",
      "street",
      "traffic",
      "bridge",
      "footpath",
      "sidewalk",
      "road damage"
    ],

    garbage: [
      "garbage",
      "trash",
      "waste",
      "dump",
      "dumping",
      "litter",
      "rubbish",
      "dirty"
    ],

    streetlights: [
      "streetlight",
      "street light",
      "lamp",
      "lights are off",
      "dark street",
      "dark road"
    ],

    water: [
      "water",
      "pipeline",
      "pipe",
      "leak",
      "leaking",
      "water supply",
      "drinking water",
      "flood"
    ],

    health: [
      "hospital",
      "clinic",
      "health",
      "medicine",
      "sanitation",
      "disease"
    ],

    education: [
      "school",
      "college",
      "classroom",
      "teacher",
      "education",
      "student"
    ],

    environment: [
      "pollution",
      "environment",
      "river",
      "lake",
      "forest",
      "tree",
      "air quality"
    ],

    safety: [
      "unsafe",
      "danger",
      "accident",
      "crime",
      "security",
      "hazard",
      "warning"
    ]
  };

  for (
    const [category, words]
    of Object.entries(
      keywords
    )
  ) {
    if (
      words.some(
        (word) =>
          question.includes(
            word
          )
      )
    ) {
      return category;
    }
  }

  return null;
}

function openPwdRoadReportFromAi(prompt) {
  const reportScreen = document.getElementById("reportScreen");
  if (!reportScreen) return;
  showScreen("reportScreen");
  const roadRadio = document.getElementById("cat-roads");
  if (roadRadio) roadRadio.checked = true;
  const description = document.getElementById("description");
  if (description) description.value = String(prompt || "").trim();
  invalidateAnalysis();
  updateStepper();
  toast("Road report opened — add location and photo", "map-pin");
}

function getPwdRoadAssistantResponse(prompt) {
  const text = String(prompt || "").trim();
  const routing = typeof routeRoadReport === "function"
    ? routeRoadReport("")
    : { authority: "Manipur Public Works Department (PWD)", division: "PWD jurisdiction review", confidence: 62 };

  return `
    <strong>PWD Road Complaint Assistant <span class="demo-badge">Demo AI</span></strong>
    <p>I understand this as a <strong>road-related complaint</strong>. I can help turn it into a structured PWD report.</p>
    <div class="insight-card">
      <p class="insight-title">Initial routing</p>
      <p class="insight-text">
        <strong>Authority:</strong> ${escapeHtml(routing.authority)}<br>
        <strong>Division:</strong> ${escapeHtml(routing.division)}<br>
        <strong>Routing confidence:</strong> ${routing.confidence}%
      </p>
    </div>
    <p>To route it more precisely, the report still needs the <strong>exact location</strong> and preferably a <strong>clear road photo</strong>. I will not invent a jurisdiction when those details are missing.</p>
    <div class="ai-suggestion-row">
      <button type="button" class="btn btn-primary btn-sm" data-action="pwd-create-report" data-prompt="${escapeHtml(text)}">
        <i data-lucide="file-plus-2"></i> Create Road Report
      </button>
      <button type="button" class="btn btn-ghost btn-sm" data-action="pwd-use-location">
        <i data-lucide="map-pin"></i> Add Location
      </button>
    </div>
  `;
}

function generateCivicAiResponse(
  prompt
) {
  const question =
    String(prompt || "")
      .toLowerCase();

  const context =
    state.civicAiContext ||
    getCivicAiContext();

  const description =
    context?.description ||
    "";

  const detectedCategory =
    detectCivicCategory(
      prompt
    ) ||
    context?.category ||
    null;

  const category =
    detectedCategory;

  let response = "";

  if (
    category === "roads" &&
    (
      question.includes("pothole") ||
      question.includes("road") ||
      question.includes("crack") ||
      question.includes("street") ||
      question.includes("bridge") ||
      question.includes("damage")
    )
  ) {
    response = getPwdRoadAssistantResponse(prompt);
  }

  else if (
    question.includes(
      "caus"
    ) ||
    question.includes(
      "why"
    ) ||
    question.includes(
      "problem"
    )
  ) {
    const causes = {
      roads:
        "Possible causes include poor drainage, road wear, overloaded traffic, weak maintenance, or construction damage.",

      garbage:
        "Possible causes include irregular collection, insufficient bins, illegal dumping, poor waste segregation, or limited collection capacity.",

      streetlights:
        "Possible causes include damaged equipment, electrical faults, aging infrastructure, or delayed maintenance.",

      water:
        "Possible causes include pipe damage, leakage, low supply capacity, contamination, or infrastructure maintenance issues.",

      health:
        "Possible causes may include sanitation problems, environmental conditions, service gaps, or limited access to public-health facilities.",

      education:
        "Possible causes may include infrastructure gaps, limited resources, overcrowding, maintenance issues, or access problems.",

      environment:
        "Possible causes may include waste accumulation, pollution, land-use changes, drainage problems, or environmental damage.",

      safety:
        "Possible causes may include poor lighting, damaged infrastructure, unsafe road conditions, insufficient signage, or limited monitoring.",

      other:
        "The exact cause depends on the situation. Useful possibilities can usually be identified by examining the location, timing, visible conditions, and available evidence."
    };

    response = `
      <strong>
        Possible causes
      </strong>

      <p>
        ${
          causes[
            category || "other"
          ]
        }
      </p>

      <p>
        I would treat these as possibilities,
        not confirmed causes. Photos,
        location details and repeated reports
        can help determine what is actually
        happening.
      </p>
    `;
  }

  else if (
    question.includes(
      "prevent"
    ) ||
    question.includes(
      "avoid"
    ) ||
    question.includes(
      "solution"
    )
  ) {
    const prevention = {
      roads:
        "Regular road inspections, drainage maintenance, timely repairs and better reporting of damaged sections can help prevent recurring problems.",

      garbage:
        "Regular collection, adequate bins, waste segregation, public awareness and monitoring of dumping hotspots can reduce the problem.",

      streetlights:
        "Routine inspections, faster fault reporting and preventive maintenance can reduce prolonged streetlight outages.",

      water:
        "Regular infrastructure inspections, leak detection, maintenance and water-quality monitoring can help prevent recurring issues.",

      health:
        "Focus on sanitation, clean surroundings, public-health monitoring and timely reporting. Health-related concerns should be handled by qualified authorities or professionals.",

      education:
        "Regular maintenance, infrastructure checks, resource planning and clear reporting channels can help prevent recurring education-related problems.",

      environment:
        "Monitoring, waste management, protection of vulnerable areas and early reporting can help reduce environmental damage.",

      safety:
        "Better lighting, infrastructure maintenance, visible warnings and timely reporting can help reduce safety risks.",

      other:
        "Prevention depends on the specific problem. First identify the likely cause, then target maintenance, monitoring, infrastructure or public awareness accordingly."
    };

    response = `
      <strong>
        Possible prevention
      </strong>

      <p>
        ${
          prevention[
            category || "other"
          ]
        }
      </p>
    `;
  }

  else if (
    question.includes(
      "evidence"
    ) ||
    question.includes(
      "measure"
    ) ||
    question.includes(
      "proof"
    ) ||
    question.includes(
      "collect"
    )
  ) {
    response = `
      <strong>
        Useful evidence
      </strong>

      <p>
        For a strong civic report,
        consider collecting:
      </p>

      <ul>
        <li>
          Clear photos or videos
        </li>

        <li>
          Exact location
        </li>

        <li>
          Date and approximate time
        </li>

        <li>
          How often the problem occurs
        </li>

        <li>
          Visible impact on people
          or infrastructure
        </li>

        <li>
          Measurements when they
          can be collected safely
        </li>
      </ul>

      <p>
        Multiple independent reports
        from the same area can also
        strengthen the signal that an
        issue needs attention.
      </p>
    `;
  }

  else if (
    question.includes(
      "department"
    ) ||
    question.includes(
      "authority"
    ) ||
    question.includes(
      "who should"
    )
  ) {
    const departments = {
      roads:
        "Public Works / Roads and infrastructure authority",

      garbage:
        "Municipal waste-management authority",

      streetlights:
        "Municipal electrical or street-lighting department",

      water:
        "Water-supply / Public Health Engineering authority",

      health:
        "Public-health or health department",

      education:
        "Education department or local education authority",

      environment:
        "Environment / pollution-control authority",

      safety:
        "Local administration, public-safety or relevant emergency authority",

      other:
        "The responsible authority depends on the location and type of issue."
    };

    response = `
      <strong>
        Likely responsible authority
      </strong>

      <p>
        ${
          departments[
            category || "other"
          ]
        }.
      </p>

      <p>
        Civic OS can use the report
        category and location to help
        route an issue to the appropriate
        authority.
      </p>
    `;
  }

  else if (
    detectedCategory
  ) {
    const detectedResponses = {
      roads: `
        <strong>
          Road issue detected
        </strong>

        <p>
          This sounds like a road or
          infrastructure problem.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Record the exact location
          and take a clear photo of
          the problem. Civic OS can
          use this information to help
          route the report to the
          appropriate road authority.
        </p>
      `,

      garbage: `
        <strong>
          Waste issue detected
        </strong>

        <p>
          This sounds like a garbage
          or waste-management problem.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Record the location,
          take a clear photo and
          note whether the waste
          is regularly accumulating.
        </p>
      `,

      streetlights: `
        <strong>
          Streetlight issue detected
        </strong>

        <p>
          This sounds like a
          street-lighting problem.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Record the location and,
          if possible, note when the
          lights stop working.
        </p>
      `,

      water: `
        <strong>
          Water issue detected
        </strong>

        <p>
          This sounds like a
          water-supply or infrastructure
          problem.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Record the location,
          describe the issue and
          note how frequently it occurs.
        </p>
      `,

      education: `
        <strong>
          Education issue detected
        </strong>

        <p>
          This sounds like an
          education or school-
          infrastructure concern.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Describe the specific
          problem and identify the
          affected facility or location.
        </p>
      `,

      health: `
        <strong>
          Public health issue detected
        </strong>

        <p>
          This sounds like a
          public-health or sanitation
          concern.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Document the location
          and describe the issue
          clearly. Health concerns
          should be handled by the
          appropriate authority or
          qualified professional.
        </p>
      `,

      environment: `
        <strong>
          Environmental issue detected
        </strong>

        <p>
          This sounds like an
          environmental concern.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Record the location,
          visible impact and supporting
          evidence such as photos.
        </p>
      `,

      safety: `
        <strong>
          Safety issue detected
        </strong>

        <p>
          This sounds like a
          public-safety concern.
        </p>

        <p>
          <strong>
            Possible next step:
          </strong>
          Record the location and
          describe the visible hazard
          clearly. For immediate danger,
          contact the appropriate
          emergency service.
        </p>
      `
    };

    response =
      detectedResponses[
        detectedCategory
      ] || "";
  }

  else {
    response = `
      <strong>
        Here's how I can help
      </strong>

      <p>
        I can help you understand
        this civic problem, explore
        possible causes, suggest
        prevention ideas, identify
        useful evidence, and think
        about the likely responsible
        authority.
      </p>

      ${
        description
          ? `
            <p>
              <strong>
                Current context:
              </strong>

              ${civicAiText(
                description.slice(
                  0,
                  180
                )
              )}
            </p>
          `
          : ""
      }

      <p>
        Try asking:
        <em>
          "What could be causing this?"
        </em>,
        <em>
          "How can it be prevented?"
        </em>,
        or
        <em>
          "What evidence should I collect?"
        </em>
      </p>
    `;
  }

  return response;
}


/* =========================================================
   12. EVENT BINDING
   ========================================================= */

function bindEvents() {

  /* ---------- Global click handling ---------- */

  document.addEventListener(
    "click",
    (event) => {

      const goto =
        event.target.closest(
          "[data-goto]"
        );

      if (goto) {

        if (
          goto.dataset.status ||
          goto.dataset.priority
        ) {
          state.filters = {
            status:
              goto.dataset.status ||
              "All",

            category:
              "all",

            priority:
              goto.dataset.priority ||
              "all",

            sort:
              "newest",

            query:
              ""
          };
        }

        showScreen(
          goto.dataset.goto
        );

        return;
      }


      const issueBtn =
        event.target.closest(
          "[data-issue]"
        );

      if (issueBtn) {
        openIssue(
          issueBtn.dataset.issue
        );

        return;
      }


      const statusChip =
        event.target.closest(
          "[data-status-filter]"
        );

      if (statusChip) {
        state.filters.status =
          statusChip.dataset
            .statusFilter;

        renderIssues();

        return;
      }


      const skillChip =
        event.target.closest(
          "[data-skill]"
        );

      if (skillChip) {
        toggleSkill(
          skillChip.dataset.skill
        );

        return;
      }

      const civicActionCard =
        event.target.closest(
          "[data-civic-action]"
        );

      if (civicActionCard) {
        openCivicAction(
          civicActionCard.dataset.civicAction
        );

        return;
      }


      const createActionButton =
        event.target.closest(
          "#createActionBtn"
        );

      if (createActionButton) {
        openCreateActivity();

        return;
      }
      const actionBtn =
        event.target.closest(
          "[data-action]"
        );

      if (!actionBtn) {
        return;
      }

      const {
        action,
        id
      } =
        actionBtn.dataset;


      if (
        action ===
        "submit-report"
      ) {
        submitReport();
      }


      if (
        action ===
        "pwd-create-report"
      ) {
        openPwdRoadReportFromAi(
          actionBtn.dataset.prompt || ""
        );
      }

      if (
        action ===
        "pwd-use-location"
      ) {
        showScreen("reportScreen");
        const locateBtn =
          document.getElementById("locateBtn");
        if (locateBtn) locateBtn.click();
      }


      if (
        action ===
        "edit-report"
      ) {
        const description =
          $("#description");

        if (description) {
          description.focus();
        }

        const form =
          $("#reportForm");

        if (form) {
          form.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }


      if (
        action ===
        "report-another"
      ) {
        const form =
          $("#reportForm");

        const panel =
          $("#aiPanel");

        if (form) {
          form.hidden =
            false;
        }

        if (panel) {
          panel.innerHTML =
            "";
        }

        state.analysis =
          null;

        state.draft =
          null;

        updateStepper();
      }


      if (
        action ===
        "use-suggestion"
      ) {
        const key =
          actionBtn.dataset.key;

        const radio =
          document.getElementById(
            `cat-${key}`
          );

        if (radio) {
          radio.checked =
            true;
        }

        if (state.draft) {
          state.analysis =
            analyzeReport({
              ...state.draft,
              categoryKey:
                key
            });

          state.draft.categoryKey =
            key;

          renderAnalysis();
        }
      }


      if (
        action ===
        "support-duplicate"
      ) {
        const issue =
          getIssue(id);

        if (!issue) {
          return;
        }

        if (
          !state.supported.has(
            id
          )
        ) {
          state.supported.add(
            id
          );

          issue.supporters++;
        }

        resetReportForm();

        invalidateAnalysis();

        updateStepper();

        toast(
          `Added your support to ${id}`
        );

        openIssue(id);
      }


      if (
        action ===
        "support"
      ) {
        toggleSupport(id);
      }


      if (
        action ===
        "advance"
      ) {
        advanceIssue(id);
      }


      if (
        action ===
        "join"
      ) {
        toggleMission(id);
      }


      if (
        action ===
        "clear-filters"
      ) {
        state.filters = {
          status: "All",
          category: "all",
          priority: "all",
          sort: "newest",
          query: ""
        };

        renderIssues();
      }

    }
  );


  /* ---------- Browser back / forward ---------- */

  window.addEventListener(
    "popstate",
    () => {
      showScreen(
        screenFromHash(),
        {
          push: false
        }
      );
    }
  );


  /* ---------- Report form ---------- */

  const form =
    $("#reportForm");

  if (form) {

    form.addEventListener(
      "submit",
      handleAnalyze
    );

    form.addEventListener(
      "input",
      (event) => {

        if (
          event.target.id ===
          "description"
        ) {
          const count =
            $("#descCount");

          if (count) {
            count.textContent =
              `${event.target.value.length} / 500`;
          }
        }

        if (
          event.target.matches(
            "[aria-invalid]"
          )
        ) {
          event.target.removeAttribute(
            "aria-invalid"
          );
        }

        if (
          event.target.type !==
          "file"
        ) {
          invalidateAnalysis();
        }

        updateStepper();
      }
    );
  }


  /* ---------- Report photo ---------- */

  const photo =
    $("#photo");

  if (photo) {
    photo.addEventListener(
      "change",
      (event) =>
        setPhoto(
          event.target.files[0]
        )
    );
  }


  const removePhoto =
    $("#removePhoto");

  if (removePhoto) {
    removePhoto.addEventListener(
      "click",
      () => {
        clearPhoto({
          revoke: true
        });

        invalidateAnalysis();
      }
    );
  }


  /* ---------- Example report ---------- */

  const exampleBtn =
    $("#exampleBtn");

  if (exampleBtn) {
    exampleBtn.addEventListener(
      "click",
      fillExample
    );
  }


  /* ---------- Location ---------- */

  const locateBtn =
    $("#locateBtn");

  if (locateBtn) {
    locateBtn.addEventListener(
      "click",
      useCurrentLocation
    );
  }


  /* ---------- Issue search ---------- */

  const issueSearch =
    $("#issueSearch");

  if (issueSearch) {
    issueSearch.addEventListener(
      "input",
      (event) => {
        state.filters.query =
          event.target.value;

        renderIssueList();
      }
    );
  }


  const filterCategory =
    $("#filterCategory");

  if (filterCategory) {
    filterCategory.addEventListener(
      "change",
      (event) => {
        state.filters.category =
          event.target.value;

        renderIssueList();
      }
    );
  }


  const filterPriority =
    $("#filterPriority");

  if (filterPriority) {
    filterPriority.addEventListener(
      "change",
      (event) => {
        state.filters.priority =
          event.target.value;

        renderIssueList();
      }
    );
  }


  const sortIssues =
    $("#sortIssues");

  if (sortIssues) {
    sortIssues.addEventListener(
      "change",
      (event) => {
        state.filters.sort =
          event.target.value;

        renderIssueList();
      }
    );
  }


  /* ---------- Issue dialog ---------- */

  const dialog =
    $("#issueDialog");

  const closeSheet =
    $("#closeSheet");

  if (
    dialog &&
    closeSheet
  ) {
    closeSheet.addEventListener(
      "click",
      () => dialog.close()
    );

    dialog.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          dialog
        ) {
          dialog.close();
        }
      }
    );

    dialog.addEventListener(
      "close",
      () => {
        state.openIssueId =
          null;
      }
    );
  }


  /* =======================================================
     CIVIC AI FILE UPLOAD
     ======================================================= */

  const civicAiFileInput =
    document.getElementById(
      "civicAiFileInput"
    );

  const civicAiFilePreview =
    document.getElementById(
      "civicAiFilePreview"
    );

  if (
    civicAiFileInput &&
    civicAiFilePreview
  ) {

    civicAiFileInput.addEventListener(
      "change",
      () => {

        const file =
          civicAiFileInput.files[0];

        if (!file) return;

        const isImage =
          file.type.startsWith(
            "image/"
          );

        const previewUrl =
          isImage
            ? URL.createObjectURL(
                file
              )
            : "";

        civicAiFilePreview.innerHTML = `
          <div class="civic-ai-file">

            ${
              isImage
                ? `
                  <img
                    src="${previewUrl}"
                    class="civic-ai-file-image"
                    alt="Uploaded civic evidence"
                  />
                `
                : `
                  <i data-lucide="file"></i>
                `
            }

            <span>
              ${civicAiText(
                file.name
              )}
            </span>

            <button
              type="button"
              id="removeCivicAiFile"
              aria-label="Remove file"
            >
              <i data-lucide="x"></i>
            </button>

          </div>
        `;

        refreshIcons();

        const removeButton =
          document.getElementById(
            "removeCivicAiFile"
          );

        if (removeButton) {

          removeButton.addEventListener(
            "click",
            () => {

              if (
                previewUrl
              ) {
                try {
                  URL.revokeObjectURL(
                    previewUrl
                  );
                } catch {}
              }

              civicAiFileInput.value =
                "";

              civicAiFilePreview.innerHTML =
                "";
            }
          );
        }

      }
    );
  }


  /* =======================================================
     CIVIC AI CHAT
     ======================================================= */

  const civicAiFab =
    document.getElementById(
      "civicAiFab"
    );

  const closeCivicAiButton =
    document.getElementById(
      "closeCivicAi"
    );

  const civicAiForm =
    document.getElementById(
      "civicAiForm"
    );

  const civicAiInput =
    document.getElementById(
      "civicAiInput"
    );


  if (civicAiFab) {
    civicAiFab.addEventListener(
      "click",
      () => {
        openCivicAi();
      }
    );
  }


  if (
    closeCivicAiButton
  ) {
    closeCivicAiButton.addEventListener(
      "click",
      () => {
        closeCivicAi();
      }
    );
  }


  if (
    civicAiForm &&
    civicAiInput
  ) {

    civicAiForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const prompt =
          civicAiInput.value.trim();

        const fileInput =
          document.getElementById(
            "civicAiFileInput"
          );

        const file =
          fileInput?.files[0];

        if (
          !prompt &&
          !file
        ) {
          return;
        }

        if (file) {

          addCivicAiMessage(
            "user",
            `${civicAiText(
              prompt ||
                "Please check this file."
            )}<br>
            <small>
              📎 Attached:
              ${civicAiText(
                file.name
              )}
            </small>`
          );

        } else {

          addCivicAiMessage(
            "user",
            civicAiText(
              prompt
            )
          );
        }

        civicAiInput.value =
          "";

        setTimeout(
          () => {

            const response =
              generateCivicAiResponse(
                prompt
              );

            addCivicAiMessage(
              "ai",
              response
            );

          },
          350
        );
      }
    );
  }


  /* ---------- Civic AI suggestions ---------- */

  document
    .querySelectorAll(
      ".ai-suggestion"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const prompt =
              button.dataset
                .aiPrompt;

            if (!prompt) {
              return;
            }

            addCivicAiMessage(
              "user",
              civicAiText(
                prompt
              )
            );

            setTimeout(
              () => {

                const response =
                  generateCivicAiResponse(
                    prompt
                  );

                addCivicAiMessage(
                  "ai",
                  response
                );

              },
              350
            );
          }
        );
      }
    );
  /* =======================================================
     CREATE CIVIC ACTIVITY
     ======================================================= */

  const cancelCreateActivity =
    document.getElementById(
      "cancelCreateActivity"
    );

  if (cancelCreateActivity) {
    cancelCreateActivity.addEventListener(
      "click",
      () => {
        const form = document.getElementById(
          "createActivityForm"
        );

        if (form) {
          form.reset();
        }

        showScreen("actionsScreen");
      }
    );
  }


  const createActivityForm =
    document.getElementById(
      "createActivityForm"
    );

  if (createActivityForm) {

    createActivityForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const title =
          document.getElementById(
            "activityTitle"
          )?.value.trim();

        const type =
          document.getElementById(
            "activityType"
          )?.value;

        const participants =
          document.getElementById(
            "activityParticipants"
          )?.value;

        const location =
          document.getElementById(
            "activityLocation"
          )?.value.trim();

        const date =
          document.getElementById(
            "activityDate"
          )?.value;

        const time =
          document.getElementById(
            "activityTime"
          )?.value;

        const description =
          document.getElementById(
            "activityDescription"
          )?.value.trim();

        const support =
          document.getElementById(
            "activitySupport"
          )?.value.trim();


        if (
          !title ||
          !type ||
          !participants ||
          !location ||
          !date ||
          !time ||
          !description
        ) {
          toast(
            "Please complete all required fields."
          );

          return;
        }


        const newActivity = {

          id:
            "activity-" +
            Date.now(),

          title,

          type,

          participants:
            Number(participants),

          location,

          date,

          time,

          description,

          support:
            support ||
            "No additional support requested.",

          image:
            type === "Tree planting"
              ? "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=85"
              : type === "Clean-up"
              ? "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1400&q=85"
              : type === "Flood preparedness"
              ? "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1400&q=85"
              : "",

          organizer:
            "Community Member",

          icon:
            type === "Clean-up"
              ? "sparkles"
              : type === "Tree planting"
              ? "trees"
              : type === "Flood preparedness"
              ? "waves"
              : type === "Community support"
              ? "users"
              : "megaphone"
        };


        if (
          !Array.isArray(
            window.civicUserActivities
          )
        ) {

          window.civicUserActivities =
            [];

        }


        window.civicUserActivities.push(
          newActivity
        );


        createActivityForm.reset();


        toast(
          "Activity created successfully!"
        );


        showScreen(
          "actionsScreen"
        );


        if (
          typeof renderCivicActions ===
          "function"
        ) {

          renderCivicActions();

        }

      }
    );

  }
}
/* =========================================================
   CIVIC ACTION DETAILS
   ========================================================= */

const civicActionData = {

  flood: {
    title: "Flood Preparedness & Awareness Drive",
    icon: "waves",
    image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1600&q=90",
    location: "Imphal",
    date: "12 October 2026",
    time: "9:00 AM – 12:00 PM",
    organizer: "Local Youth Civic Group",
    participants: 24,
    description:
      "A community-led awareness activity focused on helping residents understand flood preparedness, emergency planning and basic safety measures.",
    support:
      "Government support requested for awareness materials and coordination."
  },

  cleanup: {
    title: "Community Clean-Up Drive",
    icon: "sparkles",
    image: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1600&q=90",
    location: "Khurai",
    date: "10 October 2026",
    time: "7:00 AM – 10:00 AM",
    organizer: "Khurai Community Volunteers",
    participants: 18,
    description:
      "Residents and volunteers will work together to clean a shared public area and improve the surrounding neighbourhood.",
    support:
      "Government support requested for waste collection after the activity."
  },

  planting: {
    title: "Tree Plantation & Green Space Drive",
    icon: "trees",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=90",
    location: "Lamphel",
    date: "18 October 2026",
    time: "8:00 AM – 11:00 AM",
    organizer: "Green Manipur Community",
    participants: 31,
    description:
      "A community activity to plant trees and improve a shared green space while encouraging residents to take part in local environmental action.",
    support:
      "Government support requested for saplings, equipment and coordination."
  }

};


function openCivicAction(actionId) {

  const action =
    civicActionData[actionId];

  if (!action) {
    return;
  }

  state.civicActionId = actionId;

  const detail =
    document.getElementById(
      "actionDetailContent"
    );

  if (!detail) {
    return;
  }

  detail.innerHTML = `
    <div class="action-detail-content">

      <div class="action-detail-hero" style="${action.image ? "--action-image: url('" + action.image + "')" : ""}">
        <div class="action-detail-hero-image" aria-hidden="true"></div>

        <div class="action-detail-hero-copy">

          <span class="action-detail-category">
            <i data-lucide="hand-heart"></i>
            Civic Action
          </span>

          <h2
            id="actionDetailTitle"
            class="action-detail-title"
          >
            ${escapeHtml(action.title)}
          </h2>

          <p class="action-detail-description">
            ${escapeHtml(action.description)}
          </p>

        </div>

        <div class="action-detail-hero-icon">
          <i data-lucide="${action.icon}"></i>
        </div>
      </div>

      <div class="action-detail-stats">

        <div class="action-detail-stat">
          <span class="action-stat-icon location">
            <i data-lucide="map-pin"></i>
          </span>
          <span class="action-stat-label">Location</span>
          <strong>${escapeHtml(action.location)}</strong>
        </div>

        <div class="action-detail-stat">
          <span class="action-stat-icon date">
            <i data-lucide="calendar-days"></i>
          </span>
          <span class="action-stat-label">Date</span>
          <strong>${escapeHtml(action.date)}</strong>
        </div>

        <div class="action-detail-stat">
          <span class="action-stat-icon time">
            <i data-lucide="clock-3"></i>
          </span>
          <span class="action-stat-label">Time</span>
          <strong>${escapeHtml(action.time)}</strong>
        </div>

        <div class="action-detail-stat">
          <span class="action-stat-icon people">
            <i data-lucide="users"></i>
          </span>
          <span class="action-stat-label">Participants</span>
          <strong id="actionParticipantCount">${action.participants} joined</strong>
        </div>

      </div>

      <div class="action-detail-organizer">
        <span class="action-organizer-icon">
          <i data-lucide="users-round"></i>
        </span>
        <span>
          <small>Organized by</small>
          <strong>${escapeHtml(action.organizer)}</strong>
          <em>Community Group</em>
        </span>
      </div>

      <div class="action-detail-support">
        <span class="action-support-icon">
          <i data-lucide="landmark"></i>
        </span>
        <span>
          <strong>Government Support</strong>
          <p>${escapeHtml(action.support)}</p>
        </span>
      </div>

      <div class="action-detail-about">
        <span class="action-about-icon">
          <i data-lucide="leaf"></i>
        </span>
        <span>
          <strong>About the Activity</strong>
          <p>${escapeHtml(action.description)}</p>
        </span>
      </div>

      <button
        type="button"
        class="btn btn-primary btn-lg btn-block action-detail-join"
        id="joinCivicActionBtn"
        onclick="joinCivicAction('${actionId}')"
      >
        <i data-lucide="user-plus"></i>
        Join Activity
      </button>

    </div>
  `;

  showScreen(
    "actionDetailScreen"
  );

  refreshIcons();
}

function joinCivicAction(actionId) {

  const action =
    civicActionData[actionId];

  if (!action) {
    return;
  }


  action.participants += 1;


  const count =
    document.getElementById(
      "actionParticipantCount"
    );

  if (count) {
    count.textContent =
      action.participants;
  }


  const button =
    document.getElementById(
      "joinCivicActionBtn"
    );

  if (button) {

    button.disabled = true;

    button.innerHTML = `
      <i data-lucide="check"></i>
      Joined Activity
    `;

    refreshIcons();

  }


  toast(
    "You joined this civic activity!"
  );

}


/* =========================================================
   CIVIC ACTIONS RENDERING
   ========================================================= */

function renderCivicActions() {
  const list = document.getElementById("civicActionsList");
  if (!list) return;

  if (!Array.isArray(window.civicUserActivities)) {
    window.civicUserActivities = [];
  }

  const builtInActions = [
    {
      id: "flood",
      title: "Flood Preparedness & Awareness Drive",
      icon: "waves",
      location: "Imphal",
      participants: 24,
      description: "Help residents learn basic flood preparedness and emergency safety measures."
    },
    {
      id: "cleanup",
      title: "Community Clean-Up Drive",
      icon: "sparkles",
      location: "Khurai",
      participants: 18,
      description: "Volunteers come together to clean a shared public area and improve the neighbourhood."
    },
    {
      id: "planting",
      title: "Tree Plantation & Green Space Drive",
      icon: "trees",
      location: "Lamphel",
      participants: 31,
      description: "Help create greener community spaces through a local tree plantation activity."
    }
  ];

  const userActions = window.civicUserActivities.map((activity) => {
    civicActionData[activity.id] = activity;
    return activity;
  });

  const builtInMarkup = builtInActions.map((item) => {
    const action = civicActionData[item.id];

    return `
      <button
        type="button"
        class="action-card glass civic-action-card"
        data-civic-action="${item.id}"
      >
        <span
          class="action-card-image"
          style="background-image: linear-gradient(90deg, rgba(4,12,9,.08), rgba(4,12,9,.18)), url('${action.image || ""}')"
          aria-hidden="true"
        ></span>

        <span class="action-icon">
          <i data-lucide="${item.icon}"></i>
        </span>

        <span class="action-text">
          <span class="action-title">${escapeHtml(item.title)}</span>

          <span class="action-desc">
            ${escapeHtml(item.description)}
          </span>

          <span class="action-meta">
            <span>
              <i data-lucide="map-pin"></i>
              ${escapeHtml(action.location)}
            </span>

            <span>
              <i data-lucide="users"></i>
              ${action.participants} joined
            </span>
          </span>
        </span>

        <i
          data-lucide="arrow-up-right"
          class="action-arrow"
        ></i>
      </button>
    `;
  }).join("");

  const userMarkup = userActions.map((activity) => `
    <button
      type="button"
      class="action-card glass civic-action-card user-civic-action-card"
      data-civic-action="${activity.id}"
    >
      <span
        class="action-card-image"
        style="background-image: linear-gradient(90deg, rgba(4,12,9,.08), rgba(4,12,9,.18)), url('${activity.image || ""}')"
        aria-hidden="true"
      ></span>

      <span class="action-icon">
        <i data-lucide="${activity.icon || "megaphone"}"></i>
      </span>

      <span class="action-text">
        <span class="action-title">
          ${escapeHtml(activity.title)}
        </span>

        <span class="action-desc">
          ${escapeHtml(activity.description)}
        </span>

        <span class="action-meta">
          <span>
            <i data-lucide="map-pin"></i>
            ${escapeHtml(activity.location)}
          </span>

          <span>
            <i data-lucide="users"></i>
            ${Number(activity.participants) || 0} expected
          </span>
        </span>
      </span>

      <i
        data-lucide="arrow-up-right"
        class="action-arrow"
      ></i>
    </button>
  `).join("");

  list.innerHTML =
    builtInMarkup +
    userMarkup;

  refreshIcons();
}


/* =========================================================
   CREATE ACTIVITY SCREEN
   ========================================================= */

function openCreateActivity() {

  showScreen(
    "createActivityScreen"
  );

}

/* =========================================================
   13. INIT
   ========================================================= */

function init() {

  issues =
    SEED_ISSUES.map(
      createIssue
    );

  renderCategoryOptions();

  setupIssueFilters();

  renderSkillPicker();

  bindEvents();

  renderCivicActions();

  showScreen(
    screenFromHash(),
    {
      push: false
    }
  );

  refreshIcons();
}

init();
/* =========================================================
   CIVIC OS PUBLIC MVP BRIDGE
   Shared runtime API for enhancement layers and demos.
   ========================================================= */
window.CivicOS = window.CivicOS || {};

if (!Object.getOwnPropertyDescriptor(window.CivicOS, "issues")) {
  Object.defineProperty(window.CivicOS, "issues", {
    get: () => issues,
    configurable: true
  });
}

window.CivicOS.calculateRoadPriority = calculateRoadPriority;
window.CivicOS.getRoadPriorityReason = getRoadPriorityReason;

if (!Object.getOwnPropertyDescriptor(window.CivicOS, "state")) {
  Object.defineProperty(window.CivicOS, "state", {
    get: () => state,
    configurable: true
  });
}

window.CivicOS.analyzeReport = analyzeReport;
window.CivicOS.refreshIcons = refreshIcons;
