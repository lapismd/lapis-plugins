//! Protocol constants for Lapis Sync v3.

/// Current protocol version.
pub const PROTOCOL_VERSION: u32 = 3;

/// Revision payload schema version.
pub const REVISION_SCHEMA_VERSION: u32 = 2;

/// Transport envelope schema version.
pub const TRANSPORT_ENVELOPE_SCHEMA_VERSION: u32 = 1;

/// Object manifest schema version.
pub const MANIFEST_SCHEMA_VERSION: u32 = 2;

/// Encryption envelope version.
pub const ENCRYPTION_ENVELOPE_VERSION: u32 = 1;

/// Nostr event kind for revision events.
pub const REVISION_KIND: u32 = 78;

/// Nostr event kind for HEAD (replaceable) events.
pub const HEAD_KIND: u32 = 30078;

/// Vault scope tag prefix.
pub const VAULT_D_PREFIX: &str = "lapis-sync-v1";

/// Minimum chunk size (4 MiB).
pub const CHUNK_MIN_BYTES: usize = 4 * 1024 * 1024;

/// Target chunk size (8 MiB).
pub const CHUNK_TARGET_BYTES: usize = 8 * 1024 * 1024;

/// Maximum chunk size (16 MiB).
pub const CHUNK_MAX_BYTES: usize = 16 * 1024 * 1024;

/// Maximum buffered sync data (64 MiB).
pub const MAX_BUFFERED_SYNC_BYTES: usize = 64 * 1024 * 1024;

/// Quiet period before checkpoint (20 seconds).
pub const QUIET_PERIOD_MS: u64 = 20_000;

/// Maximum time before forced checkpoint (5 minutes).
pub const MAX_UNCOMMITTED_MS: u64 = 5 * 60_000;

/// Default algorithm decision record values.
pub mod adr_defaults {
    pub const ENCODING: &str = "canonical-json";
    pub const OBJECT_CRYPTO: &str = "hkdf-sha256-xchacha20poly1305";
    pub const EVENT_CRYPTO: &str = "vault-scoped-aead";
    pub const FILE_TAGS_DEFAULT: bool = false;
    pub const UNICODE: &str = "nfc";
    pub const ARCHIVE_QUORUM: u32 = 1;
    pub const STALE_HEAD_POLICY: &str = "active-until-revoked";
}

/// Generate a vault scope tag.
pub fn vault_scope_tag(vault_id: &str) -> String {
    format!("{}:{}", VAULT_D_PREFIX, vault_id)
}

/// Generate a HEAD tag for a vault and device.
pub fn vault_head_tag(vault_id: &str, device_public_key: Option<&str>) -> String {
    let legacy = format!("{}:{}:head", VAULT_D_PREFIX, vault_id);
    match device_public_key {
        Some(key) => format!("{}:{}", legacy, key),
        None => legacy,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_scope_tag() {
        assert_eq!(vault_scope_tag("my-vault"), "lapis-sync-v1:my-vault");
    }

    #[test]
    fn test_vault_head_tag_without_device() {
        assert_eq!(
            vault_head_tag("my-vault", None),
            "lapis-sync-v1:my-vault:head"
        );
    }

    #[test]
    fn test_vault_head_tag_with_device() {
        assert_eq!(
            vault_head_tag("my-vault", Some("device-key")),
            "lapis-sync-v1:my-vault:head:device-key"
        );
    }
}
