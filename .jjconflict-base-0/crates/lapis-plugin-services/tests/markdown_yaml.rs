use lapis_plugin_services::markdown::extract_metadata;
use serde_json::{Value, json};

#[test]
fn retained_yaml_metadata_outcomes_are_identical() {
    let fixtures: Vec<Value> =
        serde_json::from_str(include_str!("fixtures/metadata-yaml.json")).unwrap();
    let outcomes: Vec<Value> = fixtures
        .iter()
        .map(|case| {
            json!({"name": case["name"],
                "actual": extract_metadata(case["input"].as_str().unwrap()),
                "expected": case["expected"]})
        })
        .collect();
    if let Some(path) = std::env::var_os("LAPIS_METADATA_ORACLE_OUTPUT") {
        std::fs::write(path, serde_json::to_vec_pretty(&outcomes).unwrap()).unwrap();
    }
    let mismatches: Vec<&Value> = outcomes
        .iter()
        .filter(|case| case["actual"] != case["expected"])
        .collect();
    assert!(
        mismatches.is_empty(),
        "Metadata mismatches: {mismatches:#?}"
    );
}

#[test]
fn parser_version_invalidates_previous_interpretations() {
    use lapis_plugin_services::markdown::{PARSER_VERSION, content_hash};
    let source = "---\ntitle: \"before\u{0085}after\"\n---\n";
    let previous_identity = (content_hash(source), "markdown-native-v1");
    let current_identity = (content_hash(source), PARSER_VERSION);
    assert_eq!(
        extract_metadata(source)["frontmatter"]["title"],
        json!("before\u{0085}after")
    );
    assert_ne!(current_identity, previous_identity);
}
