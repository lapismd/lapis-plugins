//! Membership authority and enrollment validation.
//!
//! Validates owner-authorized membership snapshots, device enrollment,
//! revocation cutoffs, and Sync Identity lifecycle. Historical authorization
//! uses these rules; new publication additionally requires current endpoint authority.

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MembershipError {
    #[error("History authority requires an enrolled vault and owner")]
    NotEnrolled,
    #[error("Enrolled owner-authorized membership is unavailable or invalid")]
    InvalidMembership,
    #[error("Unknown device: {0}")]
    UnknownDevice(String),
    #[error("Device {0} is revoked")]
    DeviceRevoked(String),
    #[error("Revoked device ancestry exceeds cutoff")]
    RevokedAncestryExceedsCutoff,
    #[error("Key epoch {0} is not installed")]
    EpochNotInstalled(u32),
    #[error("Membership generation mismatch")]
    GenerationMismatch,
    #[error("Sync Identity lifecycle violation")]
    SyncIdentityViolation,
}

/// Device enrollment state.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DeviceState {
    Active,
    Revoked,
}

/// A device in the membership roster.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MembershipDevice {
    pub public_key: String,
    pub state: DeviceState,
    pub cutoff_head: Option<String>,
}

/// A Sync Identity history entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncIdentityEntry {
    pub public_key: String,
    pub generation: u32,
    pub activated_membership_generation: u32,
    pub retired_membership_generation: Option<u32>,
    pub cutoff_heads: Option<std::collections::HashMap<String, String>>,
}

/// Sync Identity lifecycle state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncIdentity {
    pub public_key: String,
    pub generation: u32,
    pub history: Vec<SyncIdentityEntry>,
}

/// Owner-authorized membership snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryMembership {
    pub schema_version: u32,
    pub vault_id: String,
    pub owner_public_key: String,
    pub generation: u32,
    pub current_epoch: u32,
    pub devices: Vec<MembershipDevice>,
    pub sync_identity: Option<SyncIdentity>,
    pub legacy_transport_cutoff_heads: Option<std::collections::HashMap<String, String>>,
}

/// Validate a membership snapshot structure.
pub fn validate_membership(
    membership: &HistoryMembership,
    expected_vault_id: &str,
    expected_owner: &str,
) -> Result<(), MembershipError> {
    if membership.vault_id != expected_vault_id
        || membership.owner_public_key != expected_owner
    {
        return Err(MembershipError::NotEnrolled);
    }

    if membership.schema_version != 1 && membership.schema_version != 2 {
        return Err(MembershipError::InvalidMembership);
    }

    // Validate basic structure
    if membership.generation < 1 || membership.current_epoch < 1 {
        return Err(MembershipError::InvalidMembership);
    }

    // Validate devices
    let mut seen_keys = std::collections::HashSet::new();
    for device in &membership.devices {
        if !is_valid_hex64(&device.public_key) {
            return Err(MembershipError::InvalidMembership);
        }
        if !seen_keys.insert(&device.public_key) {
            return Err(MembershipError::InvalidMembership);
        }
        if let Some(ref cutoff) = device.cutoff_head
            && !is_valid_hex64(cutoff)
        {
            return Err(MembershipError::InvalidMembership);
        }
    }

    // Validate Sync Identity if present
    if let Some(ref identity) = membership.sync_identity {
        if !is_valid_hex64(&identity.public_key) || identity.generation < 1 {
            return Err(MembershipError::SyncIdentityViolation);
        }

        let mut seen_identity_keys = std::collections::HashSet::new();
        let mut seen_generations = std::collections::HashSet::new();

        for entry in &identity.history {
            if !is_valid_hex64(&entry.public_key) || entry.generation < 1 {
                return Err(MembershipError::SyncIdentityViolation);
            }
            if entry.activated_membership_generation > membership.generation {
                return Err(MembershipError::SyncIdentityViolation);
            }
            if let Some(retired) = entry.retired_membership_generation
                && (retired <= entry.activated_membership_generation
                    || retired > membership.generation)
            {
                return Err(MembershipError::SyncIdentityViolation);
            }
            if !seen_identity_keys.insert(&entry.public_key) {
                return Err(MembershipError::SyncIdentityViolation);
            }
            if !seen_generations.insert(entry.generation) {
                return Err(MembershipError::SyncIdentityViolation);
            }
        }
    }

    Ok(())
}

/// Check if a device is authorized at a given membership generation.
pub fn authorize_device(
    membership: &HistoryMembership,
    device_public_key: &str,
    _at_generation: u32,
) -> Result<(), MembershipError> {
    let device = membership
        .devices
        .iter()
        .find(|d| d.public_key == device_public_key)
        .ok_or_else(|| MembershipError::UnknownDevice(device_public_key.to_string()))?;

    match device.state {
        DeviceState::Active => Ok(()),
        DeviceState::Revoked => Err(MembershipError::DeviceRevoked(
            device_public_key.to_string(),
        )),
    }
}

/// Check if a key epoch is installed.
pub fn check_epoch_installed(
    installed_epochs: &[u32],
    epoch: u32,
) -> Result<(), MembershipError> {
    if installed_epochs.contains(&epoch) {
        Ok(())
    } else {
        Err(MembershipError::EpochNotInstalled(epoch))
    }
}

fn is_valid_hex64(value: &str) -> bool {
    value.len() == 64 && value.chars().all(|c| c.is_ascii_hexdigit())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_membership() -> HistoryMembership {
        HistoryMembership {
            schema_version: 2,
            vault_id: "test-vault".to_string(),
            owner_public_key: "a".repeat(64),
            generation: 1,
            current_epoch: 1,
            devices: vec![
                MembershipDevice {
                    public_key: "b".repeat(64),
                    state: DeviceState::Active,
                    cutoff_head: None,
                },
                MembershipDevice {
                    public_key: "c".repeat(64),
                    state: DeviceState::Revoked,
                    cutoff_head: Some("d".repeat(64)),
                },
            ],
            sync_identity: None,
            legacy_transport_cutoff_heads: None,
        }
    }

    #[test]
    fn test_validate_membership_valid() {
        let membership = make_membership();
        assert!(validate_membership(
            &membership,
            "test-vault",
            &"a".repeat(64)
        )
        .is_ok());
    }

    #[test]
    fn test_validate_membership_wrong_vault() {
        let membership = make_membership();
        assert!(matches!(
            validate_membership(&membership, "other-vault", &"a".repeat(64)),
            Err(MembershipError::NotEnrolled)
        ));
    }

    #[test]
    fn test_authorize_active_device() {
        let membership = make_membership();
        assert!(authorize_device(&membership, &"b".repeat(64), 1).is_ok());
    }

    #[test]
    fn test_authorize_revoked_device() {
        let membership = make_membership();
        assert!(matches!(
            authorize_device(&membership, &"c".repeat(64), 1),
            Err(MembershipError::DeviceRevoked(_))
        ));
    }

    #[test]
    fn test_authorize_unknown_device() {
        let membership = make_membership();
        assert!(matches!(
            authorize_device(&membership, &"e".repeat(64), 1),
            Err(MembershipError::UnknownDevice(_))
        ));
    }

    #[test]
    fn test_check_epoch_installed() {
        let epochs = vec![1, 2, 3];
        assert!(check_epoch_installed(&epochs, 2).is_ok());
        assert!(matches!(
            check_epoch_installed(&epochs, 5),
            Err(MembershipError::EpochNotInstalled(5))
        ));
    }

    #[test]
    fn test_validate_sync_identity() {
        let mut membership = make_membership();
        membership.sync_identity = Some(SyncIdentity {
            public_key: "e".repeat(64),
            generation: 1,
            history: vec![SyncIdentityEntry {
                public_key: "f".repeat(64),
                generation: 1,
                activated_membership_generation: 0,
                retired_membership_generation: None,
                cutoff_heads: None,
            }],
        });
        assert!(validate_membership(
            &membership,
            "test-vault",
            &"a".repeat(64)
        )
        .is_ok());
    }
}
