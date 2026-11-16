# History review visibility in release acceptance

The ten-package publisher at source36d679c1 stopped in its validation step:
[43947542658](https://github.com/lapismd/lapis-plugins/actions/runs/43947542658)
failed `NativeRemotes.stories.ts > Footer And Log` with one failure and70 passes
in that shard. The exact reviewed URL was already present in a dialog `dd`,
but the immediate `toBeVisible` assertion observed it before visibility settled.
The failure preceded signing, uploading or registry dispatch.

The exact cold local target passed once before editing, confirming that the
failure is intermittent rather than a deterministic content mismatch. The
existing sibling remote-review story already waits for visible dialog content.
This repair uses that bounded `waitFor` pattern around the same exact URL and
visibility assertion, then retains Cancel and the no-push assertion. It adds no
sleep, disabled animation, changed threshold, baseline, component/CSS override
or production behavior.

At the hosted4CPU/7GiB resource limits, the exact cold target passes1/1 after
the change and all seven Native remote-composition stories pass. The complete
cold Storybook interaction/accessibility lane passes466 cases across eight
shards. History check,71 package units,97 repository controls, build and publint
pass. The unchanged root audit gate also passes under its recorded policy.
The first spec check caught one incorrect relative link in this evidence;
the owning validator identified it and the record link is corrected before
qualification. An unnecessary draft maintenance note was removed because this
private story repair needs no product release intent; the actual Storybook
change retains its mapped History chapter. All three specification lanes pass.
Hosted current-head qualification remains required before
retrying publication. The new source must qualify normally; the failed run is
not blindly rerun against unchanged bytes.

The change is confined to an existing private story play and acceptance evidence;
it requires no product Changeset or version change. The same ten actual patch
versions remain the publisher selection, with unrelated History0.5.1 and
frozen/excluded packages unchanged.
