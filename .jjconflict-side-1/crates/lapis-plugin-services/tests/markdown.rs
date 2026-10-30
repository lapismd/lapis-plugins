use lapis_plugin_services::markdown::{content_hash, extract_metadata};
use serde_json::Value;

#[test]
fn retained_renderer_metadata_fixtures_are_identical() {
    let cases: Vec<Value> = serde_json::from_str(include_str!("fixtures/metadata.json")).unwrap();
    for case in cases {
        assert_eq!(
            extract_metadata(case["input"].as_str().unwrap()),
            case["expected"],
            "{}",
            case["name"]
        );
    }
}

#[test]
fn content_identity_remains_the_retained_md5_of_utf8_bytes() {
    assert_eq!(content_hash("hello"), "5d41402abc4b2a76b9719d911017c592");
}
