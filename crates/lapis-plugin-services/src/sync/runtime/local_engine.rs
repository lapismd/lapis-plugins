//! Local engine state for checkpoint, outbox, and apply management.
//!
//! The local engine tracks durable state: encrypted objects, signed revisions,
//! outbox entries pending publication, and apply intents for incoming changes.

use crate::sync::protocol::revision::RevisionPayload;
use crate::sync::protocol::types::SignedNostrEvent;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EngineError {
    #[error("Engine not initialized")]
    NotInitialized,
    #[error("Invalid state version")]
    InvalidVersion,
    #[error("State comparison failed")]
    CompareAndSwapFailed,
    #[error("No pending checkpoint")]
    NoPendingCheckpoint,
    #[error("Outbox is empty")]
    EmptyOutbox,
    #[error("Revision not found: {0}")]
    RevisionNotFound(String),
    #[error("Apply intent already exists")]
    ApplyIntentExists,
    #[error("No apply intent")]
    NoApplyIntent,
}

/// Path record in the local object index.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathRecord {
    pub file_id: String,
    pub file_manifest_hash: String,
    pub file_manifest_epoch: u32,
    pub content_fingerprint: String,
    pub content_generation: Option<u32>,
}

/// Local object index tracking file-to-object mappings.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LocalObjectIndex {
    pub revision_event_id: Option<String>,
    pub root_hash: Option<String>,
    pub paths: HashMap<String, PathRecord>,
    pub tree_hashes: HashMap<String, String>,
    pub tree_epochs: HashMap<String, u32>,
}

/// Stored revision with associated metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredRevision {
    pub event: SignedNostrEvent,
    pub archive_hash: String,
    pub payload: RevisionPayload,
}

/// Outbox entry pending publication.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutboxEntry {
    pub revision_event_id: String,
    pub head: SignedNostrEvent,
    pub object_hashes: Vec<String>,
    pub expected_head_event_id: Option<String>,
}

/// Apply intent for incoming changes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyIntent {
    pub revision_event_id: String,
    pub archive_hash: String,
    pub operations: Vec<ApplyOperation>,
    pub completed: Vec<String>,
}

/// Individual operation within an apply intent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyOperation {
    pub file_id: String,
    pub operation: String, // "create" | "modify" | "rename" | "delete"
    pub source_path: Option<String>,
    pub target_path: String,
    pub content_object: Option<String>,
    pub content_generation: Option<u32>,
}

/// Stored HEAD event from remote devices.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredHead {
    pub event: SignedNostrEvent,
    pub device_public_key: String,
    pub revision_event_id: String,
    pub revision_archive_hash: String,
}

/// Merge draft for conflict resolution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeDraft {
    pub base_revision_id: String,
    pub tips: Vec<String>,
    pub decisions: Vec<MergeDecision>,
}

/// Individual decision in a merge draft.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeDecision {
    pub file_id: String,
    pub resolution: MergeResolution,
}

/// Resolution strategy for a merge conflict.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MergeResolution {
    Local,
    Remote,
    Base,
    Delete,
    KeepBoth,
    ResolvedText(String),
}

/// Publication receipt state.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PublicationState {
    Staged,
    Accepted,
    Applied,
}

/// Publication receipt.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicationReceipt {
    pub event_id: String,
    pub state: PublicationState,
}

/// Complete local engine state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalEngineState {
    pub schema_version: u32,
    pub vault_id: String,
    pub device_public_key: String,
    pub index: LocalObjectIndex,
    pub revisions: HashMap<String, StoredRevision>,
    pub outbox: Vec<OutboxEntry>,
    pub local_revision_id: Option<String>,
    pub applied_revision_id: Option<String>,
    pub published_head_event_id: Option<String>,
    pub last_created_at: u64,
    pub merge_draft: Option<MergeDraft>,
    pub heads: HashMap<String, StoredHead>,
    pub apply_intent: Option<ApplyIntent>,
}

impl LocalEngineState {
    /// Create a new empty engine state.
    pub fn new(vault_id: String, device_public_key: String) -> Self {
        Self {
            schema_version: 1,
            vault_id,
            device_public_key,
            index: LocalObjectIndex::default(),
            revisions: HashMap::new(),
            outbox: Vec::new(),
            local_revision_id: None,
            applied_revision_id: None,
            published_head_event_id: None,
            last_created_at: 0,
            merge_draft: None,
            heads: HashMap::new(),
            apply_intent: None,
        }
    }

    /// Check if the engine has any revisions.
    pub fn has_revisions(&self) -> bool {
        !self.revisions.is_empty()
    }

    /// Check if the outbox has pending publications.
    pub fn has_pending_outbox(&self) -> bool {
        !self.outbox.is_empty()
    }

    /// Get the next outbox entry for publication.
    pub fn next_outbox_entry(&self) -> Option<&OutboxEntry> {
        self.outbox.first()
    }

    /// Remove a completed outbox entry.
    pub fn complete_outbox_entry(&mut self, revision_event_id: &str) -> Result<(), EngineError> {
        let initial_len = self.outbox.len();
        self.outbox.retain(|entry| entry.revision_event_id != revision_event_id);
        if self.outbox.len() == initial_len {
            return Err(EngineError::RevisionNotFound(revision_event_id.to_string()));
        }
        Ok(())
    }

    /// Store a revision.
    pub fn store_revision(&mut self, revision: StoredRevision) {
        let event_id = revision.event.id.clone();
        self.revisions.insert(event_id, revision);
    }

    /// Get a revision by event ID.
    pub fn get_revision(&self, event_id: &str) -> Option<&StoredRevision> {
        self.revisions.get(event_id)
    }

    /// Store a remote HEAD.
    pub fn store_head(&mut self, device_public_key: String, head: StoredHead) {
        self.heads.insert(device_public_key, head);
    }

    /// Get a HEAD by device public key.
    pub fn get_head(&self, device_public_key: &str) -> Option<&StoredHead> {
        self.heads.get(device_public_key)
    }

    /// Check if an apply intent exists.
    pub fn has_apply_intent(&self) -> bool {
        self.apply_intent.is_some()
    }

    /// Set an apply intent.
    pub fn set_apply_intent(&mut self, intent: ApplyIntent) -> Result<(), EngineError> {
        if self.apply_intent.is_some() {
            return Err(EngineError::ApplyIntentExists);
        }
        self.apply_intent = Some(intent);
        Ok(())
    }

    /// Clear the apply intent.
    pub fn clear_apply_intent(&mut self) -> Result<(), EngineError> {
        if self.apply_intent.is_none() {
            return Err(EngineError::NoApplyIntent);
        }
        self.apply_intent = None;
        Ok(())
    }

    /// Mark an apply operation as completed.
    pub fn complete_apply_operation(&mut self, file_id: &str) -> Result<(), EngineError> {
        let intent = self.apply_intent.as_mut().ok_or(EngineError::NoApplyIntent)?;
        if !intent.completed.contains(&file_id.to_string()) {
            intent.completed.push(file_id.to_string());
        }
        Ok(())
    }

    /// Check if all apply operations are completed.
    pub fn is_apply_complete(&self) -> Result<bool, EngineError> {
        let intent = self.apply_intent.as_ref().ok_or(EngineError::NoApplyIntent)?;
        Ok(intent.completed.len() == intent.operations.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_engine_state() {
        let state = LocalEngineState::new("vault-1".to_string(), "device-1".to_string());
        assert_eq!(state.vault_id, "vault-1");
        assert_eq!(state.device_public_key, "device-1");
        assert!(!state.has_revisions());
        assert!(!state.has_pending_outbox());
    }

    #[test]
    fn test_store_and_get_revision() {
        let mut state = LocalEngineState::new("vault-1".to_string(), "device-1".to_string());
        let revision = StoredRevision {
            event: SignedNostrEvent {
                id: "event-1".to_string(),
                pubkey: "pubkey-1".to_string(),
                created_at: 1000,
                kind: 78,
                tags: vec![],
                content: "content".to_string(),
                sig: "sig".to_string(),
            },
            archive_hash: "hash-1".to_string(),
            payload: RevisionPayload {
                schema_version: 2,
                vault_id: "vault-1".to_string(),
                key_epoch: 1,
                current_epoch: 1,
                membership_generation: 0,
                parents: vec![],
                root: "root".to_string(),
                changes: vec![],
                message: "test".to_string(),
                reason: "checkpoint".to_string(),
                client: crate::sync::protocol::revision::RevisionClient {
                    protocol_version: 3,
                },
            },
        };
        state.store_revision(revision);
        assert!(state.has_revisions());
        assert!(state.get_revision("event-1").is_some());
        assert!(state.get_revision("event-2").is_none());
    }

    #[test]
    fn test_outbox_management() {
        let mut state = LocalEngineState::new("vault-1".to_string(), "device-1".to_string());
        assert!(!state.has_pending_outbox());

        let entry = OutboxEntry {
            revision_event_id: "rev-1".to_string(),
            head: SignedNostrEvent {
                id: "head-1".to_string(),
                pubkey: "pubkey-1".to_string(),
                created_at: 1000,
                kind: 30078,
                tags: vec![],
                content: "content".to_string(),
                sig: "sig".to_string(),
            },
            object_hashes: vec!["obj-1".to_string()],
            expected_head_event_id: None,
        };
        state.outbox.push(entry);
        assert!(state.has_pending_outbox());
        assert!(state.next_outbox_entry().is_some());

        state.complete_outbox_entry("rev-1").unwrap();
        assert!(!state.has_pending_outbox());
    }

    #[test]
    fn test_apply_intent_lifecycle() {
        let mut state = LocalEngineState::new("vault-1".to_string(), "device-1".to_string());
        assert!(!state.has_apply_intent());

        let intent = ApplyIntent {
            revision_event_id: "rev-1".to_string(),
            archive_hash: "hash-1".to_string(),
            operations: vec![
                ApplyOperation {
                    file_id: "file-1".to_string(),
                    operation: "create".to_string(),
                    source_path: None,
                    target_path: "path-1".to_string(),
                    content_object: Some("obj-1".to_string()),
                    content_generation: Some(1),
                },
                ApplyOperation {
                    file_id: "file-2".to_string(),
                    operation: "modify".to_string(),
                    source_path: Some("path-2".to_string()),
                    target_path: "path-2".to_string(),
                    content_object: Some("obj-2".to_string()),
                    content_generation: Some(1),
                },
            ],
            completed: vec![],
        };

        state.set_apply_intent(intent).unwrap();
        assert!(state.has_apply_intent());
        assert!(!state.is_apply_complete().unwrap());

        state.complete_apply_operation("file-1").unwrap();
        assert!(!state.is_apply_complete().unwrap());

        state.complete_apply_operation("file-2").unwrap();
        assert!(state.is_apply_complete().unwrap());

        state.clear_apply_intent().unwrap();
        assert!(!state.has_apply_intent());
    }
}
