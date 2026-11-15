//! Pure Rust implementation of Lapis Sync algorithms.
//!
//! This module provides transport-independent synchronization primitives
//! for the Lapis Sync protocol. All cryptographic operations use host-provided
//! key custody; private keys never enter this module.

pub mod objects;
pub mod protocol;
pub mod runtime;

pub use protocol::{
    BlobRef, EventFingerprint, NostrEventFilter, ReconciliationResult, RevisionTransport,
    SignedNostrEvent, VaultScope,
};
pub use protocol::{
    CHUNK_MAX_BYTES, CHUNK_MIN_BYTES, CHUNK_TARGET_BYTES, ENCRYPTION_ENVELOPE_VERSION, HEAD_KIND,
    MANIFEST_SCHEMA_VERSION, MAX_BUFFERED_SYNC_BYTES, MAX_UNCOMMITTED_MS, PROTOCOL_VERSION,
    QUIET_PERIOD_MS, REVISION_KIND, REVISION_SCHEMA_VERSION, TRANSPORT_ENVELOPE_SCHEMA_VERSION,
    VAULT_D_PREFIX,
};
