//! Deterministic canonical JSON encoding for Lapis Sync protocol.
//!
//! Keys are sorted lexicographically. No whitespace. Numbers are encoded
//! as JSON numbers (integers only for protocol use). Strings use standard
//! JSON escaping. This produces byte-identical output for identical inputs
//! across TypeScript and Rust engines.

use serde_json::Value;

/// Serialize a value to canonical JSON.
///
/// Object keys are sorted lexicographically. No extra whitespace.
/// Arrays preserve order. Null, booleans, numbers and strings use
/// standard JSON representation.
pub fn canonicalize(value: &Value) -> String {
    match value {
        Value::Null => "null".to_string(),
        Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
        Value::Number(n) => n
            .as_f64()
            .map(|value| ryu_js::Buffer::new().format(value).to_string())
            .unwrap_or_else(|| n.to_string()),
        Value::String(s) => serde_json::to_string(s).unwrap_or_default(),
        Value::Array(arr) => {
            let items: Vec<String> = arr.iter().map(canonicalize).collect();
            format!("[{}]", items.join(","))
        }
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let items: Vec<String> = keys
                .iter()
                .map(|key| {
                    let value = map.get(*key).unwrap();
                    format!(
                        "{}:{}",
                        serde_json::to_string(key).unwrap_or_default(),
                        canonicalize(value)
                    )
                })
                .collect();
            format!("{{{}}}", items.join(","))
        }
    }
}

/// Parse a canonical JSON string.
pub fn parse_canonical_json(text: &str) -> Result<Value, serde_json::Error> {
    serde_json::from_str(text)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_null() {
        assert_eq!(canonicalize(&json!(null)), "null");
    }

    #[test]
    fn test_boolean() {
        assert_eq!(canonicalize(&json!(true)), "true");
        assert_eq!(canonicalize(&json!(false)), "false");
    }

    #[test]
    fn test_integer() {
        assert_eq!(canonicalize(&json!(42)), "42");
        assert_eq!(canonicalize(&json!(0)), "0");
        assert_eq!(canonicalize(&json!(-1)), "-1");
    }

    #[test]
    fn test_ecmascript_number_formatting() {
        assert_eq!(canonicalize(&serde_json::from_str("1.0").unwrap()), "1");
        assert_eq!(canonicalize(&serde_json::from_str("-0.0").unwrap()), "0");
        assert_eq!(
            canonicalize(&serde_json::from_str("1e+21").unwrap()),
            "1e+21"
        );
    }

    #[test]
    fn test_string() {
        assert_eq!(canonicalize(&json!("hello")), r#""hello""#);
        assert_eq!(canonicalize(&json!("")), r#""""#);
    }

    #[test]
    fn test_string_escaping() {
        assert_eq!(canonicalize(&json!("hello\nworld")), r#""hello\nworld""#);
        assert_eq!(canonicalize(&json!("say \"hi\"")), r#""say \"hi\"""#);
    }

    #[test]
    fn test_array() {
        assert_eq!(canonicalize(&json!([1, 2, 3])), "[1,2,3]");
        assert_eq!(canonicalize(&json!([])), "[]");
    }

    #[test]
    fn test_object_keys_sorted() {
        let value = json!({"b": 2, "a": 1, "c": 3});
        assert_eq!(canonicalize(&value), r#"{"a":1,"b":2,"c":3}"#);
    }

    #[test]
    fn test_nested_object() {
        let value = json!({"z": {"b": 2, "a": 1}, "a": [3, 2, 1]});
        assert_eq!(canonicalize(&value), r#"{"a":[3,2,1],"z":{"a":1,"b":2}}"#);
    }

    #[test]
    fn test_roundtrip() {
        let value = json!({
            "schemaVersion": 2,
            "vaultId": "test-vault",
            "parents": [{"eventId": "abc", "archiveHash": "def"}],
            "changes": [{"fileId": "f1", "operation": "create"}],
            "message": "checkpoint"
        });
        let canonical = canonicalize(&value);
        let parsed: Value = parse_canonical_json(&canonical).unwrap();
        assert_eq!(canonicalize(&parsed), canonical);
    }

    #[test]
    fn test_deterministic_output() {
        let a = json!({"x": 1, "y": 2});
        let b = json!({"y": 2, "x": 1});
        assert_eq!(canonicalize(&a), canonicalize(&b));
    }
}
