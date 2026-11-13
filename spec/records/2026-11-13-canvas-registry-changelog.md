# Canvas 0.3.0 registry changelog override

Canvas 0.3.0's Changesets section is 6805 characters. Registry notes
refuse truncation at 4000 characters, so the version PR's static
acceptance fixture failed while converting that section.

`packages/canvas/registry.json` now owns a bounded
`releases["0.3.0"].changelog` override. The Changesets file stays
authoritative for git history; the override is the published registry
note. Static-candidate coverage rejects an oversized markdown section
without an override and accepts the Canvas 0.3.0 override. Mapped
Distribution, Canvas, native-services and governance chapters record the
same fail-closed contract.
