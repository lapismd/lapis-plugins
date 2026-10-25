use regex::Regex;
use serde_json::{Map, Value, json};
use std::sync::LazyLock;

pub const PARSER_VERSION: &str = "markdown-native-v1";

/// Retain the renderer's UTF-8 content MD5 identity for existing cache rows.
pub fn content_hash(text: &str) -> String {
    format!("{:x}", md5::compute(text))
}

fn pattern(value: &str) -> Regex {
    Regex::new(value).expect("static retained metadata expression")
}
static FRONTMATTER: LazyLock<Regex> =
    LazyLock::new(|| pattern(r"(?s)\A---\r?\n(.*?)\r?\n---\r?\n?"));
static HEADING: LazyLock<Regex> = LazyLock::new(|| pattern(r"^(#{1,6})\s+(.+?)\s*$"));
static WIKI: LazyLock<Regex> = LazyLock::new(|| pattern(r"\[\[([^\]]+)\]\]"));
static LINK: LazyLock<Regex> = LazyLock::new(|| pattern(r"\[([^\]]+)\]\(([^)]+)\)"));
static TAG: LazyLock<Regex> = LazyLock::new(|| pattern(r"(^|[\s(\[{])#([a-zA-Z0-9_/-]+)"));

fn point(text: &str, offset: usize) -> Value {
    let before = &text[..offset];
    let line = before.bytes().filter(|&b| b == b'\n').count();
    let column = before.rsplit('\n').next().unwrap_or_default();
    json!({"line": line, "col": column.encode_utf16().count(),
        "offset": before.encode_utf16().count()})
}
fn position(text: &str, start: usize, end: usize) -> Value {
    json!({"start": point(text, start), "end": point(text, end)})
}
fn append(cache: &mut Map<String, Value>, key: &str, value: Value) {
    cache
        .entry(key)
        .or_insert_with(|| json!([]))
        .as_array_mut()
        .unwrap()
        .push(value);
}
fn link_value(
    text: &str,
    start: usize,
    original: &str,
    href: &str,
    display: &str,
    heading: Option<&str>,
) -> Value {
    let mut value = json!({"link": href, "original": original,
        "displayText": display, "position": position(text, start, start + original.len())});
    if let Some(heading) = heading {
        value["heading"] = json!(heading);
    }
    value
}

/// Port of the plugin's lightweight extractor, including its existing image,
/// code-fence and link-order semantics. Rich parsing is a separate contract.
pub fn extract_metadata(text: &str) -> Value {
    let mut cache = Map::new();
    let mut offset = 0;
    if let Some(found) = FRONTMATTER.captures(text) {
        let span = found.get(0).unwrap();
        let value = serde_yaml::from_str::<Value>(&found[1]).unwrap_or(json!({}));
        cache.insert(
            "frontmatter".into(),
            if value.is_object() { value } else { json!({}) },
        );
        cache.insert("frontmatterPosition".into(), position(text, 0, span.end()));
        offset = span.end();
    }
    let mut heading: Option<String> = None;
    for line in text[offset..].split('\n') {
        if let Some(found) = HEADING.captures(line) {
            heading = Some(found[2].trim().into());
            append(
                &mut cache,
                "headings",
                json!({"heading": heading,
                "level": found[1].len(), "position": position(text, offset, offset + line.len())}),
            );
        }
        for found in WIKI.captures_iter(line) {
            let original = found.get(0).unwrap();
            let href = &found[1];
            let display = href.split('|').nth(1).unwrap_or(href);
            append(
                &mut cache,
                "links",
                link_value(
                    text,
                    offset + original.start(),
                    original.as_str(),
                    href,
                    display,
                    heading.as_deref(),
                ),
            );
        }
        for found in LINK.captures_iter(line) {
            let original = found.get(0).unwrap();
            if original.start() > 0 && line.as_bytes()[original.start() - 1] == b'!' {
                continue;
            }
            append(
                &mut cache,
                "links",
                link_value(
                    text,
                    offset + original.start(),
                    original.as_str(),
                    &found[2],
                    &found[1],
                    heading.as_deref(),
                ),
            );
        }
        for found in TAG.captures_iter(line) {
            let tag = format!("#{}", &found[2]);
            let start = offset + found.get(2).unwrap().start() - 1;
            append(
                &mut cache,
                "tags",
                json!({"tag": tag,
                "position": position(text, start, start + tag.len())}),
            );
        }
        offset += line.len() + 1;
    }
    Value::Object(cache)
}
