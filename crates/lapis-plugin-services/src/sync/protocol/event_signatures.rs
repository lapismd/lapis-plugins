//! NIP-01 event identity and BIP-340 Schnorr signature verification.
//!
//! Callers may retain mutable event values, so verification never trusts a
//! cached library result. The event identifier is recomputed from the exact
//! NIP-01 serialization before the signature is checked.

use super::crypto::sha256;
use super::types::SignedNostrEvent;
use k256::schnorr::{Signature, VerifyingKey};
use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum EventSignatureError {
    #[error("Invalid event shape")]
    InvalidShape,
    #[error("Event identifier does not match its payload")]
    IdentifierMismatch,
    #[error("Invalid Nostr signature")]
    InvalidSignature,
}

/// Return the NIP-01 event identifier for a structurally valid event.
pub fn event_id(event: &SignedNostrEvent) -> Result<[u8; 32], EventSignatureError> {
    validate_shape(event)?;
    let serialized = serde_json::to_vec(&serde_json::json!([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]))
    .map_err(|_| EventSignatureError::InvalidShape)?;
    Ok(sha256(&serialized))
}

/// Verify both the event identifier and its x-only secp256k1 Schnorr signature.
pub fn verify_signed_event(event: &SignedNostrEvent) -> Result<(), EventSignatureError> {
    let computed_id = event_id(event)?;
    let stated_id = decode_hex::<32>(&event.id).ok_or(EventSignatureError::InvalidShape)?;
    if computed_id != stated_id {
        return Err(EventSignatureError::IdentifierMismatch);
    }
    let public_key = decode_hex::<32>(&event.pubkey).ok_or(EventSignatureError::InvalidShape)?;
    let signature = decode_hex::<64>(&event.sig).ok_or(EventSignatureError::InvalidShape)?;
    let verifying_key =
        VerifyingKey::from_bytes(&public_key).map_err(|_| EventSignatureError::InvalidSignature)?;
    let signature = Signature::try_from(signature.as_slice())
        .map_err(|_| EventSignatureError::InvalidSignature)?;
    verifying_key
        .verify_raw(&computed_id, &signature)
        .map_err(|_| EventSignatureError::InvalidSignature)
}

fn validate_shape(event: &SignedNostrEvent) -> Result<(), EventSignatureError> {
    if !is_lower_hex(&event.id, 64)
        || !is_lower_hex(&event.pubkey, 64)
        || !is_lower_hex(&event.sig, 128)
    {
        return Err(EventSignatureError::InvalidShape);
    }
    Ok(())
}

fn is_lower_hex(value: &str, length: usize) -> bool {
    value.len() == length
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn decode_hex<const N: usize>(value: &str) -> Option<[u8; N]> {
    let bytes = hex::decode(value).ok()?;
    bytes.try_into().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> SignedNostrEvent {
        let fixtures: serde_json::Value = serde_json::from_str(include_str!(
            "../../../../../packages/sync/test-support/nostr-wire-fixtures.json"
        ))
        .unwrap();
        serde_json::from_value(fixtures["revision"].clone()).unwrap()
    }

    #[test]
    fn verifies_frozen_nostr_event() {
        verify_signed_event(&fixture()).unwrap();
    }

    #[test]
    fn rejects_mutation_after_a_successful_verification() {
        let mut event = fixture();
        verify_signed_event(&event).unwrap();
        event.content.push_str("tampered");
        assert_eq!(
            verify_signed_event(&event),
            Err(EventSignatureError::IdentifierMismatch)
        );
    }

    #[test]
    fn rejects_uppercase_wire_hex() {
        let mut event = fixture();
        event.id = event.id.to_uppercase();
        assert_eq!(
            verify_signed_event(&event),
            Err(EventSignatureError::InvalidShape)
        );
    }
}
