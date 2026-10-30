use lapis_plugin_services::search::canvas_text;
use serde_json::Value;

#[test]
fn retained_canvas_source_outcomes_match_the_unchanged_provider() {
    let fixtures: Value =
        serde_json::from_str(include_str!("fixtures/search-canvas.json")).unwrap();
    for case in fixtures.as_array().unwrap() {
        let content = case["content"].as_str().unwrap();
        assert_eq!(
            canvas_text(content),
            case["expected"].as_str().unwrap(),
            "{}",
            case["name"]
        );
    }
}
