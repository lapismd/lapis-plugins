//! Signed transport envelopes preserving device and owner attestations.

use super::canonical_json::canonicalize;
use super::event_signatures::{EventSignatureError, verify_signed_event};
use super::types::SignedNostrEvent;
use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum EnvelopeError {
    #[error("Invalid Nostr signature")]
    InvalidSignature,
    #[error("Transport event kind does not match the expected protocol kind")]
    UnexpectedKind,
    #[error("Transport envelope is invalid JSON")]
    InvalidJson,
    #[error("Unsupported transport envelope")]
    UnsupportedEnvelope,
    #[error("Transport and attestation metadata do not match")]
    MetadataMismatch,
}

impl From<EventSignatureError> for EnvelopeError {
    fn from(_: EventSignatureError) -> Self {
        Self::InvalidSignature
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnwrappedTransportEvent {
    pub transport_event: SignedNostrEvent,
    pub attested_event: SignedNostrEvent,
    pub legacy: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeviceEnvelope {
    schema_version: u32,
    #[serde(rename = "type")]
    envelope_type: String,
    device_event: SignedNostrEvent,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RootEnvelope {
    schema_version: u32,
    #[serde(rename = "type")]
    envelope_type: String,
    root_event: SignedNostrEvent,
}

pub fn unwrap_device_transport_event(
    event: &SignedNostrEvent,
    expected_kind: u32,
) -> Result<UnwrappedTransportEvent, EnvelopeError> {
    verify_signed_event(event)?;
    if event.kind != expected_kind {
        return Err(EnvelopeError::UnexpectedKind);
    }
    if !event.content.trim_start().starts_with('{') {
        return Ok(UnwrappedTransportEvent {
            transport_event: event.clone(),
            attested_event: event.clone(),
            legacy: true,
        });
    }
    let envelope: DeviceEnvelope =
        serde_json::from_str(&event.content).map_err(|_| EnvelopeError::InvalidJson)?;
    if envelope.schema_version != 1 || envelope.envelope_type != "lapis-sync-device-attestation" {
        return Err(EnvelopeError::UnsupportedEnvelope);
    }
    verify_signed_event(&envelope.device_event)?;
    validate_metadata(event, &envelope.device_event)?;
    Ok(UnwrappedTransportEvent {
        transport_event: event.clone(),
        attested_event: envelope.device_event,
        legacy: false,
    })
}

pub fn unwrap_root_authority_event(
    event: &SignedNostrEvent,
) -> Result<UnwrappedTransportEvent, EnvelopeError> {
    verify_signed_event(event)?;
    if !event.content.trim_start().starts_with('{') {
        return Ok(UnwrappedTransportEvent {
            transport_event: event.clone(),
            attested_event: event.clone(),
            legacy: true,
        });
    }
    let envelope: RootEnvelope =
        serde_json::from_str(&event.content).map_err(|_| EnvelopeError::InvalidJson)?;
    if envelope.schema_version != 1 || envelope.envelope_type != "lapis-sync-root-attestation" {
        return Err(EnvelopeError::UnsupportedEnvelope);
    }
    verify_signed_event(&envelope.root_event)?;
    validate_metadata(event, &envelope.root_event)?;
    Ok(UnwrappedTransportEvent {
        transport_event: event.clone(),
        attested_event: envelope.root_event,
        legacy: false,
    })
}

fn validate_metadata(
    transport: &SignedNostrEvent,
    attestation: &SignedNostrEvent,
) -> Result<(), EnvelopeError> {
    let transport_tags = serde_json::to_value(&transport.tags).expect("serializable tags");
    let attestation_tags = serde_json::to_value(&attestation.tags).expect("serializable tags");
    if transport.kind != attestation.kind
        || transport.created_at != attestation.created_at
        || canonicalize(&transport_tags) != canonicalize(&attestation_tags)
    {
        return Err(EnvelopeError::MetadataMismatch);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixtures() -> serde_json::Value {
        serde_json::from_str(include_str!(
            "../../../../../packages/sync/test-support/nostr-wire-fixtures.json"
        ))
        .unwrap()
    }

    fn event(fixtures: &serde_json::Value, name: &str) -> SignedNostrEvent {
        serde_json::from_value(fixtures[name].clone()).unwrap()
    }

    #[test]
    fn preserves_frozen_device_envelopes() {
        let fixtures = fixtures();
        let revision = event(&fixtures, "revision");
        let result = unwrap_device_transport_event(&revision, 78).unwrap();
        assert_eq!(result.transport_event, revision);
        assert!(!result.legacy);
        assert_ne!(result.attested_event.pubkey, result.transport_event.pubkey);
    }

    #[test]
    fn preserves_frozen_owner_attestation() {
        let fixtures = fixtures();
        let membership = event(&fixtures, "membership");
        let result = unwrap_root_authority_event(&membership).unwrap();
        assert_eq!(result.transport_event, membership);
        assert!(!result.legacy);
        assert_ne!(result.attested_event.pubkey, result.transport_event.pubkey);
    }

    #[test]
    fn retains_explicit_legacy_reads() {
        let fixtures = fixtures();
        let revision = event(&fixtures, "legacyRevision");
        let result = unwrap_device_transport_event(&revision, 78).unwrap();
        assert!(result.legacy);
        assert_eq!(result.attested_event, revision);
    }

    #[test]
    fn rejects_corrupt_outer_signature() {
        let fixtures = fixtures();
        let mut revision = event(&fixtures, "revision");
        revision.sig = "0".repeat(128);
        assert_eq!(
            unwrap_device_transport_event(&revision, 78),
            Err(EnvelopeError::InvalidSignature)
        );
    }
}
