/** Self-contained reference, adapted from CV Studio 34486d1e sample roles.
 * Presentation reference only: phase, summary and highlight are ordinary metadata.
 * Fixed dates keep both catalogs deterministic; no CV checkout/runtime is needed.
 */
export const referenceNotes = [
  {
    collection: "roles",
    path: "Roles/Atlas.md",
    title: "Engineering Manager, Infrastructure",
    phase: "Applied",
    owner: "Rina Shah",
    tags: ["management", "infrastructure"],
    date: "2026-06-25",
    highlight: "2026-07-01",
    body: "Submitted with a platform-leadership CV variant.\n\n## Preparation\n\n- Review platform reliability examples.\n- Prepare questions for the team.",
  },
  {
    collection: "roles",
    path: "Roles/Harbour.md",
    title: "Solutions Architect",
    phase: "Interview",
    owner: "Aisha Grant",
    tags: ["payments", "architecture"],
    date: "2026-06-26",
    highlight: "Technical interview",
    body: "Prepare a systems design walkthrough for high-volume payment processing.\n\n## Evidence\n\nPayment continuity during infrastructure changes.",
  },
  {
    collection: "notes",
    path: "Research/Fieldwork.md",
    title: "Field observations",
    phase: "Collect",
    owner: "Maya Chen",
    tags: ["research", "fieldwork"],
    date: "2026-06-25",
    highlight: 0,
    body: "Capture observations from the riverside field visit.\n\n## Findings\n\nKeep raw observations separate from interpretation.",
  },
  {
    collection: "notes",
    path: "Research/Synthesis.md",
    title: "Research synthesis",
    phase: "Reflect",
    owner: "Leo Martins",
    tags: ["research"],
    date: "2026-06-27",
    highlight: false,
    body: "Connect field notes with the interview findings.\n\n## Questions\n\nWhich patterns recur across sources?",
  },
  {
    collection: "tasks",
    path: "Tasks/Review.md",
    title: "Review the release notes",
    phase: "Doing",
    owner: "Priya Shah",
    tags: ["release"],
    date: "2026-06-26",
    highlight: "Needs review",
    body: "Check the release notes against the public contracts.\n\n- [ ] Verify examples\n- [ ] Check package versions",
  },
  {
    collection: "tasks",
    path: "Tasks/Publish.md",
    title: "Prepare publication",
    phase: "Next",
    owner: "Maya Chen",
    tags: ["release", "docs"],
    date: "",
    highlight: 3,
    body: "Prepare the documentation for publication.\n\nPublication requires a separate release approval.",
  },
] as const;

export type ReferenceCollection = "roles" | "notes" | "tasks" | "scroll";

export function referenceFiles(
  collection: ReferenceCollection,
): Record<string, string> {
  const roles = [
    [
      "Cedar Cloud",
      "Principal SRE",
      "Screening",
      "Liam Brooks",
      "Manchester, remote first",
      "Prepare incident retrospectives and examples of reducing infrastructure cost.",
    ],
    [
      "Nova Bank",
      "Staff Platform Engineer",
      "Saved",
      "Maya Patel",
      "London, hybrid",
      "Explore the developer platform roadmap and payments reliability requirements.",
    ],
    [
      "Northstar Tools",
      "Backend Lead",
      "Offer",
      "Eve Johnson",
      "Remote UK",
      "Compare the offer against current priorities and clarify equity terms.",
    ],
    [
      "MarketLane",
      "Senior Software Engineer",
      "Closed",
      "Noah Reed",
      "London",
      "Record interview feedback and retain the marketplace architecture notes.",
    ],
    [
      "Willow Health",
      "Engineering Manager",
      "Applied",
      "Amara Okafor",
      "Bristol, hybrid",
      "Prepare examples of supporting delivery teams in a regulated environment.",
    ],
    [
      "Beacon Energy",
      "Staff Data Engineer",
      "Interview",
      "Tom Cooper",
      "Remote Europe",
      "Review the streaming data platform and prepare a data quality walkthrough.",
    ],
    [
      "Orbit Commerce",
      "Developer Experience Lead",
      "Saved",
      "Rina Shah",
      "Cambridge",
      "Assess build performance, local tooling and internal platform adoption.",
    ],
    [
      "Oak Systems",
      "Security Engineering Lead",
      "Screening",
      "Priya Shah",
      "Edinburgh",
      "Prepare a threat modelling example and questions about incident ownership.",
    ],
    [
      "Harbour Labs",
      "Senior Frontend Engineer",
      "Applied",
      "Aisha Grant",
      "Remote UK",
      "Review accessibility and component design examples for the product team.",
    ],
    [
      "Fern Analytics",
      "Data Platform Architect",
      "Interview",
      "Leo Martins",
      "London",
      "Prepare a warehouse migration plan with clear operational tradeoffs.",
    ],
    [
      "Copper Networks",
      "Site Reliability Engineer",
      "Screening",
      "Maya Chen",
      "Leeds",
      "Discuss service-level objectives, on-call improvements and alert fatigue.",
    ],
    [
      "Maple Robotics",
      "Engineering Lead",
      "Saved",
      "Liam Brooks",
      "Oxford",
      "Research how the team validates software for hardware integration.",
    ],
    [
      "Tide Software",
      "Principal Backend Engineer",
      "Applied",
      "Eve Johnson",
      "Remote Europe",
      "Prepare examples of evolving APIs while preserving client compatibility.",
    ],
    [
      "Elm Learning",
      "Product Engineering Manager",
      "Interview",
      "Amara Okafor",
      "Brighton",
      "Connect coaching experience with product outcomes and user research.",
    ],
  ];
  const notes = [
    [
      "Interview themes",
      "Reflect",
      "Compare the themes emerging from recent customer interviews.",
    ],
    [
      "Accessibility findings",
      "Collect",
      "Record keyboard, focus and screen-reader observations from the prototype.",
    ],
    [
      "Onboarding journey",
      "Collect",
      "Map where new users need guidance during their first session.",
    ],
    [
      "Prototype review",
      "Reflect",
      "Connect usability observations with the current design assumptions.",
    ],
    [
      "Research questions",
      "Collect",
      "Frame the next round of interviews around unanswered questions.",
    ],
    [
      "Evidence map",
      "Reflect",
      "Link observations to their source notes before drafting conclusions.",
    ],
    [
      "Workshop agenda",
      "Share",
      "Prepare a practical agenda for the cross-team research workshop.",
    ],
    [
      "Decision log",
      "Filed",
      "Record the decisions, supporting evidence and remaining uncertainty.",
    ],
    [
      "Usability follow-up",
      "Share",
      "Share the prototype findings with participants and product partners.",
    ],
    [
      "Field visit checklist",
      "Collect",
      "Prepare consent, observation prompts and equipment for the next visit.",
    ],
    [
      "Literature review",
      "Reflect",
      "Compare published research with the patterns found in field observations.",
    ],
    [
      "Team readout",
      "Share",
      "Prepare a concise account of the findings and their implications.",
    ],
    [
      "Open questions",
      "Collect",
      "Keep unresolved questions visible for the next research cycle.",
    ],
    [
      "Archive notes",
      "Filed",
      "Preserve source material and context for future researchers.",
    ],
  ];
  const tasks = [
    [
      "Verify keyboard navigation",
      "Doing",
      "Exercise navigation, card activation and focus restoration across the board.",
    ],
    [
      "Document badge mappings",
      "Ready",
      "Explain how date, number and Boolean properties appear on cards.",
    ],
    [
      "Review tag filtering",
      "Review",
      "Confirm tag predicates remain independent for each column.",
    ],
    [
      "Audit publication dependencies",
      "Backlog",
      "Check published ranges and verify the prepared consumer archives.",
    ],
    [
      "Write migration notes",
      "Ready",
      "Describe the new view settings and compatibility defaults.",
    ],
    [
      "Confirm save-failure recovery",
      "Doing",
      "Simulate a failed Markdown write and retry without losing the draft.",
    ],
    [
      "Check metadata alignment",
      "Review",
      "Review short, long and missing property values in the two-column grid.",
    ],
    [
      "Prepare localisation copy",
      "Backlog",
      "Review labels, empty states and date formatting for localisation.",
    ],
    [
      "Rehearse rollback",
      "Ready",
      "Document how to return to the verified previous package version.",
    ],
    [
      "Review source ownership",
      "Done",
      "Confirm generic component changes remain in Design Core.",
    ],
    [
      "Validate activity dates",
      "Doing",
      "Cover date-only records, timestamps and undated notes.",
    ],
    [
      "Check scrolling boundaries",
      "Review",
      "Verify column headers remain visible while card stacks scroll.",
    ],
    [
      "Prepare release evidence",
      "Backlog",
      "Collect exact source revisions and functional verification counts.",
    ],
    [
      "Review documentation examples",
      "Done",
      "Check that public imports reproduce each documented scenario.",
    ],
  ];
  const areas = [
    "Accessibility",
    "Agent workflows",
    "Analytics",
    "Architecture",
    "Collaboration",
    "Data quality",
    "Developer experience",
    "Documentation",
    "Editor behaviour",
    "Error recovery",
    "File organisation",
    "Information design",
    "Keyboard navigation",
    "Knowledge graphs",
    "Local storage",
    "Markdown authoring",
    "Metadata",
    "Mobile capture",
    "Notifications",
    "Offline access",
    "Performance",
    "Search relevance",
    "Team onboarding",
    "Version history",
  ];
  const activities = [
    "Interview notes",
    "Field observations",
    "Source review",
    "Prototype evaluation",
    "Open questions",
    "Evidence map",
    "Design critique",
    "Usability findings",
    "Research synthesis",
    "Workshop notes",
    "Decision log",
    "Follow-up plan",
    "Technical review",
    "Experiment notes",
    "Team readout",
    "Next steps",
  ];
  const owners = ["Maya Chen", "Priya Shah", "Leo Martins", "Amara Okafor"];
  const originals = referenceNotes
    .filter((note) => note.collection === collection)
    .map((note) => ({
      ...note,
      company: note.path.includes("Atlas")
        ? "Atlas AI"
        : note.path.includes("Harbour")
          ? "Harbour Payments"
          : "",
      location: note.path.includes("Atlas")
        ? "Remote UK"
        : note.path.includes("Harbour")
          ? "London"
          : "",
    }));
  const extra =
    collection === "roles"
      ? roles.map(
          ([company, title, phase, owner, location, summary], index) => ({
            path: `Roles/${company.replaceAll(" ", "-")}.md`,
            title,
            phase,
            owner,
            company,
            location,
            date: `2026-06-${String(20 + (index % 8)).padStart(2, "0")}`,
            highlight: index % 2 ? "Preparation ready" : "Review requested",
            tags: ["applications", index % 2 ? "platform" : "leadership"],
            body: `${summary}\n\n## Preparation\n\n- Review the role and team context.\n- Prepare relevant experience and questions.`,
          }),
        )
      : collection === "notes"
        ? notes.map(([title, phase, summary], index) => ({
            path: `Research/${title.replaceAll(" ", "-")}.md`,
            title,
            phase,
            owner: owners[index % owners.length],
            company: "",
            location: "",
            date:
              index === notes.length - 1
                ? ""
                : `2026-06-${String(20 + (index % 8)).padStart(2, "0")}`,
            highlight:
              index % 3 === 0 ? false : index % 3 === 1 ? 0 : "Ready to share",
            tags: ["research", phase.toLowerCase()],
            body: `${summary}\n\n## Evidence\n\nKeep links to the original observations and record uncertainty alongside conclusions.`,
          }))
        : collection === "tasks"
          ? tasks.map(([title, phase, summary], index) => ({
              path: `Tasks/${title.replaceAll(" ", "-")}.md`,
              title,
              phase,
              owner: owners[index % owners.length],
              company: "",
              location: "",
              date: `2026-06-${String(20 + (index % 8)).padStart(2, "0")}`,
              highlight: index % 2 ? "Needs review" : "Ready to begin",
              tags: ["delivery", "kanban"],
              body: `${summary}\n\n## Acceptance\n\n- [ ] Verify the intended behaviour.\n- [ ] Record the result in the owning package.`,
            }))
          : areas.flatMap((phase, areaIndex) =>
              activities.map((activity, index) => ({
                path: `Collection/${phase}/${activity}.md`,
                title: `${phase}: ${activity.toLowerCase()}`,
                phase,
                owner: owners[(areaIndex + index) % owners.length],
                company: "",
                location: "",
                date: `2026-06-${String(20 + (index % 8)).padStart(2, "0")}`,
                highlight: index % 2 ? "Ready to discuss" : "Evidence needed",
                tags: ["research", phase.toLowerCase().replaceAll(" ", "-")],
                body: `${activity} for the ${phase.toLowerCase()} research stream. Capture findings, link source material and identify the next useful experiment.\n\n## Discussion\n\nSeparate direct observations from assumptions and record outstanding questions.`,
              })),
            );
  const records = collection === "scroll" ? extra : [...originals, ...extra];
  return Object.fromEntries(
    records.map((note) => [
      note.path,
      "---\n" +
        Object.entries({
          title: note.title,
          category:
            collection === "roles"
              ? "Opportunities"
              : collection === "tasks"
                ? note.tags.some((tag) => tag === "release")
                  ? "Release readiness"
                  : "Product delivery"
                : collection === "notes"
                  ? "Research"
                  : note.phase,
          phase: note.phase,
          owner: note.owner,
          company: note.company,
          location: note.location,
          tags: [...note.tags],
          occurred: note.date || null,
          highlight: note.highlight,
          followUp: note.date
            ? `2026-07-${String(1 + (note.title.length % 9)).padStart(2, "0")}`
            : null,
        })
          .map(([key, value]) => key + ": " + JSON.stringify(value))
          .join("\n") +
        "\n---\n\n" +
        note.body +
        "\n",
    ]),
  );
}
