//! Pure Rust implementation of Lapis Sync algorithms.
//!
//! This module provides transport-independent synchronization primitives
//! for the Lapis Sync protocol. All cryptographic operations use host-provided
//! key custody; private keys never enter this module.

pub mod protocol;
pub mod objects;
pub mod runtime;

pub use protocol::{
    BlobRef, SignedNostrEvent, EventFingerprint, VaultScope, NostrEventFilter,
    ReconciliationResult, RevisionTransport,
};
pub use protocol::{
    PROTOCOL_VERSION, REVISION_SCHEMA_VERSION, TRANSPORT_ENVELOPE_SCHEMA_VERSION,
    MANIFEST_SCHEMA_VERSION, ENCRYPTION_ENVELOPE_VERSION, REVISION_KIND, HEAD_KIND,
    VAULT_D_PREFIX, CHUNK_MIN_BYTES, CHUNK_TARGET_BYTES, CHUNK_MAX_BYTES,
    MAX_BUFFERED_SYNC_BYTES, QUIET_PERIOD_MS, MAX_UNCOMMITTED_MS,
};
