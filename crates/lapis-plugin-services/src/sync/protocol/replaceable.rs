//! Replaceable event addressing and ordering (NIP-01).
//!
//! Replaceable events share an address composed of (kind, pubkey, #d tag).
//! Within one address, newer timestamps win; ties break on lowest lexical
//! event ID. Independent device HEADs remain independent.

use super::types::SignedNostrEvent;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ReplaceableError {
    #[error("Not a sync replaceable event")]
    NotReplaceable,
    #[error("Replaceable event address mismatch")]
    AddressMismatch,
}

/// Compute the replaceable address for an event.
///
/// Returns error if the event kind is not 30078 or 30079.
pub fn replaceable_event_address(event: &SignedNostrEvent) -> Result<String, ReplaceableError> {
    if event.kind != 30078 && event.kind != 30079 {
        return Err(ReplaceableError::NotReplaceable);
    }
    let d_tag = event
        .tags
        .iter()
        .find(|tag| tag.first().map(|s| s.as_str()) == Some("d"))
        .and_then(|tag| tag.get(1))
        .cloned()
        .unwrap_or_default();
    Ok(format!(
        "[{},\"{}\",\"{}\"]",
        event.kind, event.pubkey, d_tag
    ))
}

/// Compare two replaceable events sharing one address.
///
/// Returns:
/// - `Ok(Ordering::Less)` if left wins (newer timestamp, or lower ID on tie)
/// - `Ok(Ordering::Greater)` if right wins
/// - `Ok(Ordering::Equal)` if identical
/// - `Err(ReplaceableError::AddressMismatch)` if addresses differ
pub fn compare_replaceable_events(
    left: &SignedNostrEvent,
    right: &SignedNostrEvent,
) -> Result<std::cmp::Ordering, ReplaceableError> {
    let left_addr = replaceable_event_address(left)?;
    let right_addr = replaceable_event_address(right)?;
    if left_addr != right_addr {
        return Err(ReplaceableError::AddressMismatch);
    }

    // Newest timestamp first
    match right.created_at.cmp(&left.created_at) {
        std::cmp::Ordering::Equal => {
            // Lowest lexical event ID on tie
            Ok(left.id.cmp(&right.id))
        }
        other => Ok(other),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cmp::Ordering;

    fn make_event(kind: u32, pubkey: &str, d_tag: &str, created_at: u64, id: &str) -> SignedNostrEvent {
        SignedNostrEvent {
            id: id.to_string(),
            pubkey: pubkey.to_string(),
            created_at,
            kind,
            tags: vec![vec!["d".to_string(), d_tag.to_string()]],
            content: String::new(),
            sig: String::new(),
        }
    }

    #[test]
    fn test_replaceable_address() {
        let event = make_event(30078, "pubkey1", "vault-id", 1000, "a".repeat(64).as_str());
        let addr = replaceable_event_address(&event).unwrap();
        assert_eq!(addr, r#"[30078,"pubkey1","vault-id"]"#);
    }

    #[test]
    fn test_not_replaceable() {
        let event = make_event(78, "pubkey1", "vault-id", 1000, "id1");
        assert_eq!(
            replaceable_event_address(&event),
            Err(ReplaceableError::NotReplaceable)
        );
    }

    #[test]
    fn test_newer_wins() {
        let old = make_event(30078, "pk", "d", 1000, "a".repeat(64).as_str());
        let new = make_event(30078, "pk", "d", 2000, "b".repeat(64).as_str());
        assert_eq!(
            compare_replaceable_events(&new, &old).unwrap(),
            Ordering::Less
        );
        assert_eq!(
            compare_replaceable_events(&old, &new).unwrap(),
            Ordering::Greater
        );
    }

    #[test]
    fn test_tie_breaks_on_id() {
        let a = make_event(30078, "pk", "d", 1000, "a".repeat(64).as_str());
        let b = make_event(30078, "pk", "d", 1000, "b".repeat(64).as_str());
        assert_eq!(
            compare_replaceable_events(&a, &b).unwrap(),
            Ordering::Less
        );
    }

    #[test]
    fn test_address_mismatch() {
        let a = make_event(30078, "pk1", "d1", 1000, "a".repeat(64).as_str());
        let b = make_event(30078, "pk2", "d2", 1000, "b".repeat(64).as_str());
        assert_eq!(
            compare_replaceable_events(&a, &b),
            Err(ReplaceableError::AddressMismatch)
        );
    }

    #[test]
    fn test_equal_events() {
        let a = make_event(30078, "pk", "d", 1000, "id");
        let b = make_event(30078, "pk", "d", 1000, "id");
        assert_eq!(
            compare_replaceable_events(&a, &b).unwrap(),
            Ordering::Equal
        );
    }
}
