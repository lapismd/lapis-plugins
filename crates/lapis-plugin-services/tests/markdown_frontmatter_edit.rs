use lapis_plugin_services::markdown::{patch_frontmatter, read_frontmatter};
use serde_json::{Map, json};

#[test]
fn edits_only_selected_keys_in_crlf_yaml() {
    let note = "---\r\n# notes\r\nuntouched: 'é' # keep\r\nstatus: old # status\r\ntags:\r\n  - keep\r\n  - remove\r\n# next\r\nnested:\r\n  flag: true\r\n---\r\n\r\n# Markdown\r\n";
    let set = json!({"status": "new", "aliases": ["Name"], "nullable": null});
    let result = patch_frontmatter(note, set.as_object().unwrap(), &["tags".into()]).unwrap();
    assert!(result.contains("untouched: 'é' # keep\r\n"));
    assert!(result.contains("\"status\": \"new\" # status\r\n"));
    assert!(result.contains("# next\r\nnested:\r\n  flag: true\r\n"));
    assert!(result.ends_with("---\r\n\r\n# Markdown\r\n"));
    assert_eq!(
        json!(read_frontmatter(&result).unwrap()),
        json!({"untouched":"é", "status":"new", "nested":{"flag":true}, "aliases":["Name"], "nullable":null})
    );
}

#[test]
fn creates_header_and_preserves_no_op_bytes() {
    let note = "# Markdown\n\nbody\n";
    let set = json!({"property":{"items":[1, true, "two"]}});
    let updated = patch_frontmatter(note, set.as_object().unwrap(), &[]).unwrap();
    assert_eq!(read_frontmatter(note).unwrap(), Map::new());
    assert!(updated.ends_with(note));
    assert_eq!(
        patch_frontmatter(&updated, set.as_object().unwrap(), &["missing".into()]).unwrap(),
        updated
    );
    let emptied = patch_frontmatter(&updated, &Map::new(), &["property".into()]).unwrap();
    assert!(emptied.ends_with(note));
    assert!(read_frontmatter(&emptied).unwrap().is_empty());
}

#[test]
fn refuses_malformed_yaml_and_changes_to_unrelated_aliases() {
    let set = json!({"source": "new"});
    for note in [
        "---\nsource: [\n---\nbody\n",
        "---\nsource: first\nsource: second\n---\nbody\n",
        "---\nsource: old\n",
    ] {
        assert!(read_frontmatter(note).is_err());
        assert!(patch_frontmatter(note, set.as_object().unwrap(), &[]).is_err());
    }
    let note = "---\nsource: &shared old\nkeep: *shared\n---\nbody\n";
    assert!(patch_frontmatter(note, set.as_object().unwrap(), &[]).is_err());
    assert!(
        patch_frontmatter(
            "---\nsource: old\n---\nbody\n",
            set.as_object().unwrap(),
            &["source".into()],
        )
        .is_err()
    );
}
