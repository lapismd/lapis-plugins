//! Core protocol types for Lapis Sync.

use serde::{Deserialize, Serialize};

/// Reference to a content-addressed blob.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BlobRef {
    /// SHA-256 hash of the blob content (hex-encoded).
    pub hash: String,
    /// Size of the blob in bytes.
    pub size: u64,
}

/// Signed Nostr event (NIP-01 compatible).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SignedNostrEvent {
    /// Event ID (SHA-256 of serialized event).
    pub id: String,
    /// Publisher public key (hex-encoded).
    pub pubkey: String,
    /// Unix timestamp.
    pub created_at: u64,
    /// Event kind.
    pub kind: u32,
    /// Event tags (array of tag arrays).
    pub tags: Vec<Vec<String>>,
    /// Event content (may be encrypted).
    pub content: String,
    /// Schnorr signature (hex-encoded).
    pub sig: String,
}

/// Fingerprint for event reconciliation (minimal identifying information).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EventFingerprint {
    pub id: String,
    pub created_at: u64,
}

/// Scope for vault-specific operations.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VaultScope {
    pub vault_id: String,
}

/// Event filter for querying events (NIP-01 compatible).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct NostrEventFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kinds: Option<Vec<u32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authors: Option<Vec<String>>,
    #[serde(rename = "#d", skip_serializing_if = "Option::is_none")]
    pub d_tag: Option<Vec<String>>,
    #[serde(rename = "#p", skip_serializing_if = "Option::is_none")]
    pub p_tag: Option<Vec<String>>,
    #[serde(rename = "#v", skip_serializing_if = "Option::is_none")]
    pub v_tag: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub since: Option<u64>,
}

/// Result of reconciliation between local and remote event sets.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ReconciliationResult {
    /// Event IDs present remotely but missing locally.
    pub missing_local_ids: Vec<String>,
    /// Event IDs present locally but missing remotely.
    pub missing_remote_ids: Vec<String>,
    /// Whether negentropy protocol was used.
    pub used_negentropy: bool,
}

/// Trait for event transport operations.
///
/// This trait defines the interface for publishing and retrieving events.
/// Implementations may use Nostr relays, HTTP APIs, or other transports.
pub trait RevisionTransport {
    /// Publish a generic event (optional).
    fn publish_event(
        &mut self,
        event: &SignedNostrEvent,
    ) -> impl std::future::Future<Output = Result<(), String>> + Send;

    /// Publish a revision event.
    fn publish_revision(
        &mut self,
        event: &SignedNostrEvent,
    ) -> impl std::future::Future<Output = Result<(), String>> + Send;

    /// Publish a HEAD event.
    fn publish_head(
        &mut self,
        event: &SignedNostrEvent,
    ) -> impl std::future::Future<Output = Result<(), String>> + Send;

    /// List current HEAD events for a vault.
    fn list_heads(
        &mut self,
        vault: &VaultScope,
    ) -> impl std::future::Future<Output = Result<Vec<SignedNostrEvent>, String>> + Send;

    /// Fetch events by ID.
    fn fetch_events(
        &mut self,
        ids: &[String],
    ) -> impl std::future::Future<Output = Result<Vec<SignedNostrEvent>, String>> + Send;

    /// List revision event IDs for a vault.
    fn list_revision_ids(
        &mut self,
        vault: &VaultScope,
    ) -> impl std::future::Future<Output = Result<Vec<String>, String>> + Send;

    /// Reconcile local and remote event sets (optional).
    fn reconcile(
        &mut self,
        scope: &VaultScope,
        local_events: &[EventFingerprint],
    ) -> impl std::future::Future<Output = Result<ReconciliationResult, String>> + Send;

    /// Subscribe to events for a vault.
    fn subscribe(
        &mut self,
        scope: &VaultScope,
        handler: impl Fn(SignedNostrEvent) + Send + 'static,
    ) -> impl std::future::Future<Output = Result<Box<dyn FnOnce() + Send>, String>> + Send;

    /// Query relay information (optional).
    fn relay_info(
        &mut self,
    ) -> impl std::future::Future<Output = Result<Vec<u32>, String>> + Send;

    /// Query events matching a filter (optional).
    fn query_events(
        &mut self,
        filter: &NostrEventFilter,
    ) -> impl std::future::Future<Output = Result<Vec<SignedNostrEvent>, String>> + Send;

    /// Subscribe to events matching a filter (optional).
    fn subscribe_events(
        &mut self,
        filter: &NostrEventFilter,
        handler: impl Fn(SignedNostrEvent) + Send + 'static,
    ) -> impl std::future::Future<Output = Result<Box<dyn FnOnce() + Send>, String>> + Send;
}
