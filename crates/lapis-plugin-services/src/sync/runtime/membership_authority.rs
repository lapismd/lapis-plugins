//! Owner-authorized membership and historical cutoff policy.
//!
//! Signature and envelope verification happens in the protocol layer. This
//! module consumes that verified projection plus a caller-provided ancestry
//! predicate, so it remains independent of storage and transport.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use thiserror::Error;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum MembershipError {
    #[error("History authority requires an enrolled vault and owner")]
    NotEnrolled,
    #[error("Enrolled owner-authorized membership is unavailable or invalid")]
    InvalidMembership,
    #[error("Enrolled membership Sync Identity lineage is invalid")]
    InvalidSyncIdentity,
    #[error("Enrolled membership has no unique active Sync Identity")]
    NoActiveSyncIdentity,
    #[error("Installed membership key epochs are unavailable or invalid")]
    InvalidInstalledEpochs,
    #[error("Key epoch {0} is not installed")]
    EpochNotInstalled(u32),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DeviceState {
    Active,
    Revoked,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MembershipDevice {
    pub public_key: String,
    pub state: DeviceState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cutoff_head: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SyncIdentityEntry {
    pub public_key: String,
    pub generation: u32,
    pub activated_membership_generation: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retired_membership_generation: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cutoff_heads: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SyncIdentity {
    pub public_key: String,
    pub generation: u32,
    pub history: Vec<SyncIdentityEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HistoryMembership {
    pub schema_version: u32,
    pub vault_id: String,
    pub owner_public_key: String,
    pub generation: u32,
    pub current_epoch: u32,
    pub devices: Vec<MembershipDevice>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sync_identity: Option<SyncIdentity>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub legacy_transport_cutoff_heads: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MembershipAuthorizationPayload {
    pub vault_id: String,
    pub membership_generation: u32,
    pub current_epoch: u32,
    pub key_epoch: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revision_event_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MembershipAuthorizationRecord {
    pub event_id: String,
    pub event_kind: u32,
    pub transport_public_key: String,
    pub attested_device_public_key: String,
    pub device_public_key: String,
    pub legacy: bool,
    pub payload: MembershipAuthorizationPayload,
}

pub fn validate_membership(
    membership: &HistoryMembership,
    expected_vault_id: &str,
    expected_owner: &str,
) -> Result<(), MembershipError> {
    if membership.vault_id != expected_vault_id || membership.owner_public_key != expected_owner {
        return Err(MembershipError::NotEnrolled);
    }
    if !matches!(membership.schema_version, 1 | 2) || membership.current_epoch < 1 {
        return Err(MembershipError::InvalidMembership);
    }
    let mut devices = HashSet::new();
    for device in &membership.devices {
        if !is_hash(&device.public_key)
            || !devices.insert(device.public_key.as_str())
            || device
                .cutoff_head
                .as_deref()
                .is_some_and(|value| !is_hash(value))
        {
            return Err(MembershipError::InvalidMembership);
        }
    }
    if let Some(identity) = &membership.sync_identity {
        if !is_hash(&identity.public_key) || identity.generation < 1 {
            return Err(MembershipError::InvalidSyncIdentity);
        }
        let mut keys = HashSet::new();
        let mut generations = HashSet::new();
        for entry in &identity.history {
            if !is_hash(&entry.public_key)
                || entry.generation < 1
                || entry.activated_membership_generation > membership.generation
                || entry.retired_membership_generation.is_some_and(|retired| {
                    retired <= entry.activated_membership_generation
                        || retired > membership.generation
                })
                || !keys.insert(entry.public_key.as_str())
                || !generations.insert(entry.generation)
            {
                return Err(MembershipError::InvalidSyncIdentity);
            }
        }
        let active: Vec<_> = identity
            .history
            .iter()
            .filter(|entry| entry.retired_membership_generation.is_none())
            .collect();
        if active.len() != 1
            || active[0].public_key != identity.public_key
            || active[0].generation != identity.generation
        {
            return Err(MembershipError::NoActiveSyncIdentity);
        }
    }
    Ok(())
}

pub fn validate_installed_epochs(
    installed_epochs: &[u32],
    membership: &HistoryMembership,
) -> Result<Vec<u32>, MembershipError> {
    let mut values: Vec<_> = installed_epochs
        .iter()
        .copied()
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    if values.is_empty()
        || values.len() > 1024
        || values
            .iter()
            .any(|epoch| *epoch < 1 || *epoch > membership.current_epoch)
    {
        return Err(MembershipError::InvalidInstalledEpochs);
    }
    values.sort_unstable_by(|left, right| right.cmp(left));
    Ok(values)
}

/// Authorize a verified record using owner-approved membership history.
pub fn authorize_membership_record(
    membership: &HistoryMembership,
    installed_epochs: &[u32],
    record: &MembershipAuthorizationRecord,
    is_ancestor_or_equal: impl Fn(&str, &str) -> bool,
) -> Result<bool, MembershipError> {
    let epochs = validate_installed_epochs(installed_epochs, membership)?;
    let payload = &record.payload;
    if payload.vault_id != membership.vault_id
        || payload.membership_generation > membership.generation
        || payload.current_epoch < 1
        || payload.current_epoch > membership.current_epoch
        || payload.key_epoch < 1
        || payload.key_epoch > payload.current_epoch
        || !epochs.contains(&payload.key_epoch)
        || !matches!(record.event_kind, 78 | 30078)
        || record.attested_device_public_key != record.device_public_key
    {
        return Ok(false);
    }
    let Some(device) = membership
        .devices
        .iter()
        .find(|device| device.public_key == record.device_public_key)
    else {
        return Ok(false);
    };
    let revision_id = if record.event_kind == 78 {
        record.event_id.as_str()
    } else if let Some(revision_id) = payload.revision_event_id.as_deref() {
        revision_id
    } else {
        return Ok(false);
    };
    if !is_hash(revision_id) {
        return Ok(false);
    }
    let within = |cutoff: Option<&String>| {
        cutoff
            .filter(|value| is_hash(value))
            .is_some_and(|value| is_ancestor_or_equal(revision_id, value))
    };
    if device.state == DeviceState::Revoked
        && (record.event_kind == 30078 || !within(device.cutoff_head.as_ref()))
    {
        return Ok(false);
    }
    if record.legacy {
        return Ok(membership.sync_identity.is_none()
            || within(
                membership
                    .legacy_transport_cutoff_heads
                    .as_ref()
                    .and_then(|cutoffs| cutoffs.get(&device.public_key)),
            ));
    }
    let Some(identity) = membership.sync_identity.as_ref().and_then(|identity| {
        identity
            .history
            .iter()
            .find(|entry| entry.public_key == record.transport_public_key)
    }) else {
        return Ok(false);
    };
    if payload.membership_generation < identity.activated_membership_generation {
        return Ok(false);
    }
    Ok(identity.retired_membership_generation.is_none()
        || (payload.membership_generation < identity.retired_membership_generation.unwrap()
            && within(
                identity
                    .cutoff_heads
                    .as_ref()
                    .and_then(|cutoffs| cutoffs.get(&device.public_key)),
            )))
}

pub fn check_epoch_installed(installed_epochs: &[u32], epoch: u32) -> Result<(), MembershipError> {
    if installed_epochs.contains(&epoch) {
        Ok(())
    } else {
        Err(MembershipError::EpochNotInstalled(epoch))
    }
}

fn is_hash(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn membership() -> HistoryMembership {
        HistoryMembership {
            schema_version: 2,
            vault_id: "vault".into(),
            owner_public_key: "a".repeat(64),
            generation: 0,
            current_epoch: 1,
            devices: vec![MembershipDevice {
                public_key: "b".repeat(64),
                state: DeviceState::Active,
                cutoff_head: None,
            }],
            sync_identity: None,
            legacy_transport_cutoff_heads: None,
        }
    }

    #[test]
    fn generation_zero_membership_is_valid() {
        let membership = membership();
        validate_membership(&membership, "vault", &"a".repeat(64)).unwrap();
    }

    #[test]
    fn uppercase_keys_fail_closed() {
        let mut membership = membership();
        membership.devices[0].public_key = "B".repeat(64);
        assert_eq!(
            validate_membership(&membership, "vault", &"a".repeat(64)),
            Err(MembershipError::InvalidMembership)
        );
    }

    #[test]
    fn installed_epochs_are_unique_and_descending() {
        let mut membership = membership();
        membership.current_epoch = 3;
        assert_eq!(
            validate_installed_epochs(&[1, 3, 2, 3], &membership).unwrap(),
            vec![3, 2, 1]
        );
    }

    #[test]
    fn rejects_empty_or_future_installed_epochs() {
        let membership = membership();
        assert_eq!(
            validate_installed_epochs(&[], &membership),
            Err(MembershipError::InvalidInstalledEpochs)
        );
        assert_eq!(
            validate_installed_epochs(&[2], &membership),
            Err(MembershipError::InvalidInstalledEpochs)
        );
    }
}
