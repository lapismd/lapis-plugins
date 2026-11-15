//! Event filter validation and matching (NIP-01 compatible).

use super::types::{NostrEventFilter, SignedNostrEvent};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum FilterError {
    #[error("Invalid event filter")]
    InvalidFilter,
    #[error("Unsupported event filter field: {0}")]
    UnsupportedField(String),
    #[error("Invalid since filter")]
    InvalidSince,
    #[error("Invalid event filter field: {0}")]
    InvalidField(String),
}

/// Validate an event filter.
pub fn validate_event_filter(filter: &NostrEventFilter) -> Result<(), FilterError> {
    // Deserialization into the strongly typed, deny-unknown-fields structure
    // performs the same validation as the TypeScript boundary.
    let _ = filter;
    Ok(())
}

/// Check if an event matches a filter.
pub fn matches_event_filter(
    event: &SignedNostrEvent,
    filter: &NostrEventFilter,
) -> Result<bool, FilterError> {
    validate_event_filter(filter)?;

    // Check ids
    if let Some(ids) = &filter.ids
        && !ids.contains(&event.id)
    {
        return Ok(false);
    }

    // Check authors
    if let Some(authors) = &filter.authors
        && !authors.contains(&event.pubkey)
    {
        return Ok(false);
    }

    // Check kinds
    if let Some(kinds) = &filter.kinds
        && !kinds.contains(&event.kind)
    {
        return Ok(false);
    }

    // Check #d tag
    if let Some(d_values) = &filter.d_tag {
        let event_d = event
            .tags
            .iter()
            .find(|tag| tag.first().map(|s| s.as_str()) == Some("d"))
            .and_then(|tag| tag.get(1))
            .map(|s| s.as_str())
            .unwrap_or("");
        if !d_values.contains(&event_d.to_string()) {
            return Ok(false);
        }
    }

    // Check #p tag
    if let Some(p_values) = &filter.p_tag {
        let has_match = event.tags.iter().any(|tag| {
            tag.first().map(|s| s.as_str()) == Some("p")
                && tag.get(1).map(|v| p_values.contains(v)).unwrap_or(false)
        });
        if !has_match {
            return Ok(false);
        }
    }

    // Check #v tag
    if let Some(v_values) = &filter.v_tag {
        let has_match = event.tags.iter().any(|tag| {
            tag.first().map(|s| s.as_str()) == Some("v")
                && tag.get(1).map(|v| v_values.contains(v)).unwrap_or(false)
        });
        if !has_match {
            return Ok(false);
        }
    }

    // Check since
    if let Some(since) = filter.since
        && event.created_at < since
    {
        return Ok(false);
    }

    Ok(true)
}

/// Check if an event matches any of the filters (OR semantics).
pub fn matches_event_filters(
    event: &SignedNostrEvent,
    filters: &[NostrEventFilter],
) -> Result<bool, FilterError> {
    // Validate all filters first
    for filter in filters {
        validate_event_filter(filter)?;
    }

    // Check if any filter matches
    for filter in filters {
        if matches_event_filter(event, filter)? {
            return Ok(true);
        }
    }

    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_event(
        id: &str,
        pubkey: &str,
        kind: u32,
        created_at: u64,
        tags: Vec<Vec<&str>>,
    ) -> SignedNostrEvent {
        SignedNostrEvent {
            id: id.to_string(),
            pubkey: pubkey.to_string(),
            created_at,
            kind,
            tags: tags
                .into_iter()
                .map(|t| t.into_iter().map(|s| s.to_string()).collect())
                .collect(),
            content: String::new(),
            sig: String::new(),
        }
    }

    #[test]
    fn test_empty_filter_matches_all() {
        let event = make_event("id1", "pubkey1", 78, 1000, vec![]);
        let filter = NostrEventFilter::default();
        assert!(matches_event_filter(&event, &filter).unwrap());
    }

    #[test]
    fn test_filter_by_id() {
        let event = make_event("id1", "pubkey1", 78, 1000, vec![]);
        let filter = NostrEventFilter {
            ids: Some(vec!["id1".to_string()]),
            ..Default::default()
        };
        assert!(matches_event_filter(&event, &filter).unwrap());

        let filter = NostrEventFilter {
            ids: Some(vec!["id2".to_string()]),
            ..Default::default()
        };
        assert!(!matches_event_filter(&event, &filter).unwrap());
    }

    #[test]
    fn test_filter_by_kind() {
        let event = make_event("id1", "pubkey1", 78, 1000, vec![]);
        let filter = NostrEventFilter {
            kinds: Some(vec![78]),
            ..Default::default()
        };
        assert!(matches_event_filter(&event, &filter).unwrap());

        let filter = NostrEventFilter {
            kinds: Some(vec![30078]),
            ..Default::default()
        };
        assert!(!matches_event_filter(&event, &filter).unwrap());
    }

    #[test]
    fn test_filter_by_d_tag() {
        let event = make_event("id1", "pubkey1", 78, 1000, vec![vec!["d", "value1"]]);
        let filter = NostrEventFilter {
            d_tag: Some(vec!["value1".to_string()]),
            ..Default::default()
        };
        assert!(matches_event_filter(&event, &filter).unwrap());

        let filter = NostrEventFilter {
            d_tag: Some(vec!["value2".to_string()]),
            ..Default::default()
        };
        assert!(!matches_event_filter(&event, &filter).unwrap());
    }

    #[test]
    fn test_filter_by_since() {
        let event = make_event("id1", "pubkey1", 78, 1000, vec![]);
        let filter = NostrEventFilter {
            since: Some(500),
            ..Default::default()
        };
        assert!(matches_event_filter(&event, &filter).unwrap());

        let filter = NostrEventFilter {
            since: Some(1500),
            ..Default::default()
        };
        assert!(!matches_event_filter(&event, &filter).unwrap());
    }

    #[test]
    fn test_multiple_filters_or_semantics() {
        let event = make_event("id1", "pubkey1", 78, 1000, vec![]);
        let filters = vec![
            NostrEventFilter {
                ids: Some(vec!["id2".to_string()]),
                ..Default::default()
            },
            NostrEventFilter {
                ids: Some(vec!["id1".to_string()]),
                ..Default::default()
            },
        ];
        assert!(matches_event_filters(&event, &filters).unwrap());
    }
}
