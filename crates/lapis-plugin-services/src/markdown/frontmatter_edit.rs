//! Lossless editing of individual keys in a saved Markdown YAML mapping.
use super::frontmatter::convert;
use saphyr::{LoadableYamlNode, MarkedYaml, Scalar, Yaml, YamlData};
use serde_json::{Map, Value};
use std::{collections::BTreeSet, ops::Range};

const MAX_YAML_BYTES: usize = 64 * 1024;

#[derive(Debug, PartialEq, Eq, thiserror::Error)]
pub enum FrontmatterError {
    #[error("Expected a valid, bounded YAML frontmatter mapping")]
    Invalid,
    #[error("The YAML layout does not allow this edit without changing unrelated content")]
    UnsupportedLayout,
}

fn block(text: &str) -> Result<Option<Range<usize>>, FrontmatterError> {
    let Some((opening, rest)) = text.split_once('\n') else {
        return Ok(None);
    };
    if opening.trim_end_matches('\r') != "---" {
        return Ok(None);
    }
    let start = opening.len() + 1;
    let mut end = start;
    for line in rest.split_inclusive('\n') {
        if line.trim_end_matches(['\r', '\n']) == "---" {
            return Ok(Some(start..end));
        }
        end += line.len();
        if end - start > MAX_YAML_BYTES {
            break;
        }
    }
    Err(FrontmatterError::Invalid)
}

fn properties(yaml: &str) -> Result<Map<String, Value>, FrontmatterError> {
    if yaml.len() > MAX_YAML_BYTES {
        return Err(FrontmatterError::Invalid);
    }
    let docs = Yaml::load_from_str(yaml).map_err(|_| FrontmatterError::Invalid)?;
    match docs.as_slice() {
        [] => Ok(Map::new()),
        [Yaml::Mapping(_)] => match convert(&docs[0], 0) {
            Ok(Value::Object(properties)) => Ok(properties),
            _ => Err(FrontmatterError::Invalid),
        },
        _ => Err(FrontmatterError::Invalid),
    }
}

pub fn read_frontmatter(text: &str) -> Result<Map<String, Value>, FrontmatterError> {
    block(text)?.map_or_else(|| Ok(Map::new()), |range| properties(&text[range]))
}

pub fn patch_frontmatter(
    text: &str,
    set: &Map<String, Value>,
    remove: &[String],
) -> Result<String, FrontmatterError> {
    let removals: BTreeSet<&str> = remove.iter().map(String::as_str).collect();
    if removals.len() != remove.len()
        || set.keys().any(|key| removals.contains(key.as_str()))
        || set
            .keys()
            .map(String::as_str)
            .chain(removals.iter().copied())
            .any(|key| key.is_empty() || key.len() > 256 || key.chars().any(char::is_control))
    {
        return Err(FrontmatterError::Invalid);
    }
    let range = block(text)?;
    let yaml = range.as_ref().map_or("", |range| &text[range.clone()]);
    let before = properties(yaml)?;
    let mut expected = before.clone();
    for key in remove {
        expected.remove(key);
    }
    expected.extend(set.clone());
    if before == expected {
        return Ok(text.to_owned());
    }
    let eol = if text
        .split_once('\n')
        .is_some_and(|(line, _)| line.ends_with('\r'))
    {
        "\r\n"
    } else {
        "\n"
    };
    let mut updated = edit_mapping(yaml, &before, set, &removals, eol)?;
    if properties(&updated)? != expected {
        return Err(FrontmatterError::UnsupportedLayout);
    }
    // Keep an empty line inside an empty header for the existing metadata extractor.
    if updated.is_empty() {
        updated.push_str(eol);
    }
    if let Some(range) = range {
        let mut output = text.to_owned();
        output.replace_range(range, &updated);
        Ok(output)
    } else {
        Ok(format!("---{eol}{updated}---{eol}{text}"))
    }
}

fn edit_mapping(
    yaml: &str,
    before: &Map<String, Value>,
    set: &Map<String, Value>,
    remove: &BTreeSet<&str>,
    eol: &str,
) -> Result<String, FrontmatterError> {
    let docs = MarkedYaml::load_from_str(yaml).map_err(|_| FrontmatterError::Invalid)?;
    let mut starts = Vec::new();
    if let [doc] = docs.as_slice() {
        let YamlData::Mapping(mapping) = &doc.data else {
            return Err(FrontmatterError::Invalid);
        };
        let offsets = yaml
            .char_indices()
            .map(|(offset, _)| offset)
            .chain(std::iter::once(yaml.len()))
            .collect::<Vec<_>>();
        for (key, value) in mapping {
            let YamlData::Value(Scalar::String(name)) = &key.data else {
                return Err(FrontmatterError::UnsupportedLayout);
            };
            let start = *offsets
                .get(key.span.start.index())
                .ok_or(FrontmatterError::UnsupportedLayout)?;
            let value_end = offsets.get(value.span.end.index()).copied();
            starts.push((start, name.as_ref(), value_end));
        }
        if mapping.is_empty() && !yaml.lines().all(is_trivia) {
            return Err(FrontmatterError::UnsupportedLayout);
        }
    }
    starts.sort_unstable_by_key(|entry| entry.0);
    let mut result = yaml.to_owned();
    for (index, &(start, name, value_end)) in starts.iter().enumerate().rev() {
        if !remove.contains(name) && set.get(name).is_none_or(|v| before.get(name) == Some(v)) {
            continue;
        }
        let end = starts.get(index + 1).map_or(yaml.len(), |entry| entry.0);
        if !(start == 0 || yaml.as_bytes().get(start - 1) == Some(&b'\n')) || start >= end {
            return Err(FrontmatterError::UnsupportedLayout);
        }
        let mut content_end = start;
        let mut offset = start;
        for line in yaml[start..end].split_inclusive('\n') {
            offset += line.len();
            if !is_trivia(line) {
                content_end = offset;
            }
        }
        let comment = value_end
            .filter(|end| (start..content_end).contains(end))
            .and_then(|end| yaml[end..content_end].split('\n').next())
            .map(|tail| tail.trim_end_matches('\r'))
            .filter(|tail| tail.trim_start().starts_with('#'));
        let replacement = match set.get(name) {
            Some(value) => match comment {
                Some(comment) => format!(
                    "{}: {value} {}{eol}",
                    Value::from(name),
                    comment.trim_start()
                ),
                None => format!("{}: {value}{eol}", Value::from(name)),
            },
            None => comment.map_or_else(String::new, |comment| {
                format!("{}{eol}", comment.trim_start())
            }),
        };
        result.replace_range(start..content_end, &replacement);
    }
    for (name, value) in set.iter().filter(|(name, _)| !before.contains_key(*name)) {
        if !result.is_empty() && !result.ends_with('\n') {
            result.push_str(eol);
        }
        result.push_str(&format!("{}: {value}{eol}", Value::from(name.as_str())));
    }
    Ok(result)
}

fn is_trivia(line: &str) -> bool {
    let line = line.trim_start();
    line.is_empty() || line.starts_with('#')
}
