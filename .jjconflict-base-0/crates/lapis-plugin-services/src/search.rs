//! Pure Search source algorithms; provider admission and persistence stay host-owned.

use serde_json::Value;

/// Extract the retained built-in Canvas provider's ordered, human-readable source.
/// Invalid JSON or invalid collection/field operations preserve the complete input.
pub fn canvas_text(content: &str) -> String {
    let extract = || -> Option<String> {
        let canvas: Value = serde_json::from_str(content).ok()?;
        if canvas.is_null() {
            return None;
        }
        let mut parts = Vec::new();
        for (collection, fields) in [
            ("nodes", &["type", "text", "label", "file", "url"][..]),
            ("edges", &["label"][..]),
        ] {
            let values = match canvas.get(collection) {
                None | Some(Value::Null) => continue,
                Some(Value::Array(values)) => values,
                _ => return None,
            };
            for value in values {
                if value.is_null() {
                    return None;
                }
                for field in fields {
                    match value.get(*field) {
                        None | Some(Value::Null) => {}
                        Some(Value::String(text)) => {
                            if !text.trim_matches(ecmascript_space).is_empty() {
                                parts.push(text.as_str());
                            }
                        }
                        _ => return None,
                    }
                }
            }
        }
        Some(parts.join("\n"))
    };
    extract().unwrap_or_else(|| content.into())
}

fn ecmascript_space(character: char) -> bool {
    matches!(
        character,
        '\u{9}'..='\u{d}'
            | ' '
            | '\u{a0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200a}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202f}'
            | '\u{205f}'
            | '\u{3000}'
            | '\u{feff}'
    )
}
