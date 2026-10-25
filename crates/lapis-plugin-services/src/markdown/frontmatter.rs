//! YAML 1.2 metadata projected through the retained JSON persistence boundary.
use saphyr::{LoadableYamlNode, Scalar, Yaml};
use serde_json::{Map, Value};

pub(super) fn parse(source: &str) -> Value {
    let Ok(documents) = Yaml::load_from_str(source) else {
        return Value::Object(Map::new());
    };
    if documents.len() != 1 {
        return Value::Object(Map::new());
    }
    convert(&documents[0], 0).unwrap_or_else(|()| Value::Object(Map::new()))
}

fn numeric(value: f64) -> Value {
    if !value.is_finite() {
        return Value::Null;
    }
    serde_json::from_str(ryu_js::Buffer::new().format(value))
        .expect("finite JavaScript number is valid JSON")
}

fn key(node: &Yaml<'_>, depth: usize) -> Result<String, ()> {
    if depth > 128 {
        return Err(());
    }
    Ok(match node {
        Yaml::Value(Scalar::Null) => String::new(),
        Yaml::Value(Scalar::Boolean(value)) => value.to_string(),
        Yaml::Value(Scalar::Integer(value)) => ryu_js::Buffer::new().format(*value as f64).into(),
        Yaml::Value(Scalar::FloatingPoint(value)) => {
            let value = value.0;
            if value.is_nan() {
                "NaN".into()
            } else if value == f64::INFINITY {
                "Infinity".into()
            } else if value == f64::NEG_INFINITY {
                "-Infinity".into()
            } else {
                ryu_js::Buffer::new().format(value).into()
            }
        }
        Yaml::Value(Scalar::String(value)) => value.to_string(),
        Yaml::Tagged(_, value) => key(value, depth + 1)?,
        _ => return Err(()),
    })
}

fn convert(node: &Yaml<'_>, depth: usize) -> Result<Value, ()> {
    if depth > 128 {
        return Err(());
    }
    Ok(match node {
        Yaml::Value(Scalar::Null) => Value::Null,
        Yaml::Value(Scalar::Boolean(value)) => Value::Bool(*value),
        Yaml::Value(Scalar::Integer(value)) => numeric(*value as f64),
        Yaml::Value(Scalar::FloatingPoint(value)) => numeric(value.0),
        Yaml::Value(Scalar::String(value)) => Value::String(value.to_string()),
        Yaml::Sequence(values) => Value::Array(
            values
                .iter()
                .map(|value| convert(value, depth + 1))
                .collect::<Result<_, _>>()?,
        ),
        Yaml::Mapping(values) => Value::Object(
            values
                .iter()
                .map(|(name, value)| Ok((key(name, depth + 1)?, convert(value, depth + 1)?)))
                .collect::<Result<_, _>>()?,
        ),
        Yaml::Tagged(_, value) => convert(value, depth + 1)?,
        Yaml::Representation(..) | Yaml::Alias(..) | Yaml::BadValue => return Err(()),
    })
}
