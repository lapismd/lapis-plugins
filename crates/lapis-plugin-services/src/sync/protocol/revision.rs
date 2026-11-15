//! Revision and HEAD payload handling.
//!
//! Provides parsing, validation, and construction of revision and HEAD events.
//! Revision payloads describe file changes; HEAD events track device tips.

use super::constants::{HEAD_KIND, REVISION_KIND, REVISION_SCHEMA_VERSION};
use super::types::SignedNostrEvent;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum RevisionError {
    #[error("Unsupported revision schema version: {0}")]
    UnsupportedSchema(u32),
    #[error("Invalid revision payload")]
    InvalidPayload,
    #[error("Invalid epoch value")]
    InvalidEpoch,
    #[error("Invalid generation value")]
    InvalidGeneration,
}

/// A file change within a revision.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RevisionChange {
    pub file_id: String,
    pub operation: String, // "create" | "modify" | "rename" | "delete"
}

/// A parent reference in a revision.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RevisionParent {
    #[serde(rename = "eventId")]
    pub event_id: String,
    #[serde(rename = "archiveHash")]
    pub archive_hash: String,
}

/// A revision payload describing file changes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevisionPayload {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "vaultId")]
    pub vault_id: String,
    #[serde(rename = "keyEpoch")]
    pub key_epoch: u32,
    #[serde(rename = "currentEpoch")]
    pub current_epoch: u32,
    #[serde(rename = "membershipGeneration")]
    pub membership_generation: u32,
    pub parents: Vec<RevisionParent>,
    pub root: String,
    pub changes: Vec<RevisionChange>,
    pub message: String,
    pub reason: String, // "autosave" | "checkpoint" | "restore-file" | "restore-vault" | "merge"
    pub client: RevisionClient,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevisionClient {
    #[serde(rename = "protocolVersion")]
    pub protocol_version: u32,
}

/// A HEAD payload tracking a device tip.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadPayload {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "vaultId")]
    pub vault_id: String,
    #[serde(rename = "revisionEventId")]
    pub revision_event_id: String,
    #[serde(rename = "revisionArchiveHash")]
    pub revision_archive_hash: String,
    pub root: String,
    #[serde(rename = "keyEpoch")]
    pub key_epoch: u32,
    #[serde(rename = "currentEpoch")]
    pub current_epoch: u32,
    #[serde(rename = "membershipGeneration")]
    pub membership_generation: u32,
}

/// Parse and validate a revision payload.
pub fn parse_revision_payload(value: &serde_json::Value) -> Result<RevisionPayload, RevisionError> {
    let schema_version = value
        .get("schemaVersion")
        .and_then(|v| v.as_u64())
        .ok_or(RevisionError::InvalidPayload)? as u32;

    if schema_version != 1 && schema_version != REVISION_SCHEMA_VERSION {
        return Err(RevisionError::UnsupportedSchema(schema_version));
    }

    let vault_id = value
        .get("vaultId")
        .and_then(|v| v.as_str())
        .ok_or(RevisionError::InvalidPayload)?;

    let root = value
        .get("root")
        .and_then(|v| v.as_str())
        .ok_or(RevisionError::InvalidPayload)?;

    let key_epoch = value
        .get("keyEpoch")
        .and_then(|v| v.as_u64())
        .ok_or(RevisionError::InvalidEpoch)? as u32;

    if key_epoch < 1 {
        return Err(RevisionError::InvalidEpoch);
    }

    let current_epoch = if schema_version == 1 {
        key_epoch
    } else {
        let epoch = value
            .get("currentEpoch")
            .and_then(|v| v.as_u64())
            .ok_or(RevisionError::InvalidEpoch)? as u32;
        if epoch < 1 {
            return Err(RevisionError::InvalidEpoch);
        }
        epoch
    };

    let membership_generation = if schema_version == 1 {
        0
    } else {
        value
            .get("membershipGeneration")
            .and_then(|v| v.as_u64())
            .ok_or(RevisionError::InvalidGeneration)? as u32
    };

    let parents: Vec<RevisionParent> = value
        .get("parents")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|p| {
                    let event_id = p.get("eventId")?.as_str()?.to_string();
                    let archive_hash = p.get("archiveHash")?.as_str()?.to_string();
                    Some(RevisionParent {
                        event_id,
                        archive_hash,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    let changes: Vec<RevisionChange> = value
        .get("changes")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|c| {
                    let file_id = c.get("fileId")?.as_str()?.to_string();
                    let operation = c.get("operation")?.as_str()?.to_string();
                    Some(RevisionChange { file_id, operation })
                })
                .collect()
        })
        .unwrap_or_default();

    let message = value
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let reason = value
        .get("reason")
        .and_then(|v| v.as_str())
        .unwrap_or("checkpoint")
        .to_string();

    let protocol_version = value
        .get("client")
        .and_then(|v| v.get("protocolVersion"))
        .and_then(|v| v.as_u64())
        .unwrap_or(1) as u32;

    Ok(RevisionPayload {
        schema_version: REVISION_SCHEMA_VERSION,
        vault_id: vault_id.to_string(),
        key_epoch,
        current_epoch,
        membership_generation,
        parents,
        root: root.to_string(),
        changes,
        message,
        reason,
        client: RevisionClient { protocol_version },
    })
}

/// Parse and validate a HEAD payload.
pub fn parse_head_payload(value: &serde_json::Value) -> Result<HeadPayload, RevisionError> {
    let schema_version = value
        .get("schemaVersion")
        .and_then(|v| v.as_u64())
        .ok_or(RevisionError::InvalidPayload)? as u32;

    if schema_version != 1 && schema_version != REVISION_SCHEMA_VERSION {
        return Err(RevisionError::UnsupportedSchema(schema_version));
    }

    let vault_id = value
        .get("vaultId")
        .and_then(|v| v.as_str())
        .ok_or(RevisionError::InvalidPayload)?;

    let revision_event_id = value
        .get("revisionEventId")
        .and_then(|v| v.as_str())
        .ok_or(RevisionError::InvalidPayload)?;

    let revision_archive_hash = value
        .get("revisionArchiveHash")
        .and_then(|v| v.as_str())
        .ok_or(RevisionError::InvalidPayload)?;

    let root = value
        .get("root")
        .and_then(|v| v.as_str())
        .ok_or(RevisionError::InvalidPayload)?;

    let key_epoch = value
        .get("keyEpoch")
        .and_then(|v| v.as_u64())
        .ok_or(RevisionError::InvalidEpoch)? as u32;

    if key_epoch < 1 {
        return Err(RevisionError::InvalidEpoch);
    }

    let current_epoch = if schema_version == 1 {
        key_epoch
    } else {
        let epoch = value
            .get("currentEpoch")
            .and_then(|v| v.as_u64())
            .ok_or(RevisionError::InvalidEpoch)? as u32;
        if epoch < 1 {
            return Err(RevisionError::InvalidEpoch);
        }
        epoch
    };

    let membership_generation = if schema_version == 1 {
        0
    } else {
        value
            .get("membershipGeneration")
            .and_then(|v| v.as_u64())
            .ok_or(RevisionError::InvalidGeneration)? as u32
    };

    Ok(HeadPayload {
        schema_version: REVISION_SCHEMA_VERSION,
        vault_id: vault_id.to_string(),
        revision_event_id: revision_event_id.to_string(),
        revision_archive_hash: revision_archive_hash.to_string(),
        root: root.to_string(),
        key_epoch,
        current_epoch,
        membership_generation,
    })
}

/// Validate that an event has the correct kind for a revision or HEAD.
pub fn validate_event_kind(event: &SignedNostrEvent, expected: u32) -> Result<(), RevisionError> {
    if event.kind != expected && event.kind != REVISION_KIND && event.kind != HEAD_KIND {
        return Err(RevisionError::InvalidPayload);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_parse_revision_payload_v2() {
        let value = json!({
            "schemaVersion": 2,
            "vaultId": "test-vault",
            "keyEpoch": 1,
            "currentEpoch": 1,
            "membershipGeneration": 0,
            "parents": [],
            "root": "root-hash",
            "changes": [
                {"fileId": "file1", "operation": "create"}
            ],
            "message": "Initial commit",
            "reason": "checkpoint",
            "client": {"protocolVersion": 3}
        });

        let payload = parse_revision_payload(&value).unwrap();
        assert_eq!(payload.vault_id, "test-vault");
        assert_eq!(payload.key_epoch, 1);
        assert_eq!(payload.changes.len(), 1);
        assert_eq!(payload.changes[0].operation, "create");
    }

    #[test]
    fn test_parse_revision_payload_v1_upgrade() {
        let value = json!({
            "schemaVersion": 1,
            "vaultId": "test-vault",
            "keyEpoch": 1,
            "parents": [],
            "root": "root-hash",
            "changes": [],
            "message": "test",
            "reason": "checkpoint",
            "client": {"protocolVersion": 1}
        });

        let payload = parse_revision_payload(&value).unwrap();
        assert_eq!(payload.schema_version, REVISION_SCHEMA_VERSION);
        assert_eq!(payload.current_epoch, 1); // upgraded from keyEpoch
        assert_eq!(payload.membership_generation, 0);
    }

    #[test]
    fn test_parse_revision_payload_unsupported_schema() {
        let value = json!({
            "schemaVersion": 99,
            "vaultId": "test",
            "root": "root"
        });

        assert!(matches!(
            parse_revision_payload(&value),
            Err(RevisionError::UnsupportedSchema(99))
        ));
    }

    #[test]
    fn test_parse_head_payload() {
        let value = json!({
            "schemaVersion": 2,
            "vaultId": "test-vault",
            "revisionEventId": "rev-id",
            "revisionArchiveHash": "rev-hash",
            "root": "root-hash",
            "keyEpoch": 1,
            "currentEpoch": 1,
            "membershipGeneration": 0
        });

        let head = parse_head_payload(&value).unwrap();
        assert_eq!(head.vault_id, "test-vault");
        assert_eq!(head.revision_event_id, "rev-id");
    }

    #[test]
    fn test_parse_head_payload_missing_fields() {
        let value = json!({
            "schemaVersion": 2,
            "vaultId": "test"
        });

        assert!(matches!(
            parse_head_payload(&value),
            Err(RevisionError::InvalidPayload)
        ));
    }
}
