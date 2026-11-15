use super::*;
use crate::sync::runtime::{
    HistoryMembership, MembershipAuthorizationRecord, authorize_membership_record,
    validate_membership,
};
use serde_json::Value;
use std::cmp::Ordering;
use std::collections::HashMap;

fn fixtures() -> Value {
    serde_json::from_str(include_str!(
        "../../../../../packages/sync/test-support/protocol-parity-fixtures.json"
    ))
    .unwrap()
}

fn wire() -> Value {
    serde_json::from_str(include_str!(
        "../../../../../packages/sync/test-support/nostr-wire-fixtures.json"
    ))
    .unwrap()
}

fn as_event(value: &Value) -> SignedNostrEvent {
    serde_json::from_value(value.clone()).unwrap()
}

fn ordering(value: i64) -> Ordering {
    value.cmp(&0)
}

#[test]
fn canonical_json_matches_complete_outputs() {
    let fixtures = fixtures();
    assert_eq!(fixtures["schemaVersion"], 1);
    for fixture in fixtures["canonical"].as_array().unwrap() {
        assert_eq!(
            canonicalize(&fixture["input"]),
            fixture["output"].as_str().unwrap(),
            "{}",
            fixture["name"]
        );
    }
}

#[test]
fn event_filter_matches_complete_outputs_and_failures() {
    let fixtures = fixtures();
    let section = &fixtures["filter"];
    let event = as_event(&section["event"]);
    for fixture in section["cases"].as_array().unwrap() {
        let filter: NostrEventFilter = serde_json::from_value(fixture["filter"].clone()).unwrap();
        assert_eq!(
            matches_event_filter(&event, &filter).unwrap(),
            fixture["matches"].as_bool().unwrap(),
            "{}",
            fixture["name"]
        );
    }
    for fixture in section["invalid"].as_array().unwrap() {
        assert!(
            serde_json::from_value::<NostrEventFilter>(fixture["filter"].clone()).is_err(),
            "{}",
            fixture["name"]
        );
    }
}

#[test]
fn replaceable_ordering_matches_complete_outputs_and_failures() {
    let fixtures = fixtures();
    let section = &fixtures["replaceable"];
    let events = section["events"].as_object().unwrap();
    for fixture in section["addresses"].as_array().unwrap() {
        let event = as_event(&events[fixture["event"].as_str().unwrap()]);
        assert_eq!(
            replaceable_event_address(&event).unwrap(),
            fixture["output"].as_str().unwrap()
        );
    }
    for fixture in section["comparisons"].as_array().unwrap() {
        let left = as_event(&events[fixture["left"].as_str().unwrap()]);
        let right = as_event(&events[fixture["right"].as_str().unwrap()]);
        assert_eq!(
            compare_replaceable_events(&left, &right).unwrap(),
            ordering(fixture["output"].as_i64().unwrap())
        );
    }
    for fixture in section["failures"].as_array().unwrap() {
        let left = as_event(&events[fixture["left"].as_str().unwrap()]);
        let right = as_event(&events[fixture["right"].as_str().unwrap()]);
        assert!(
            compare_replaceable_events(&left, &right).is_err(),
            "{}",
            fixture["name"]
        );
    }
}

#[test]
fn ancestry_matches_complete_outputs() {
    let fixtures = fixtures();
    let section = &fixtures["ancestry"];
    let nodes: HashMap<String, RevisionNode> = section["nodes"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(event_id, parents)| {
            (
                event_id.clone(),
                RevisionNode {
                    event_id: event_id.clone(),
                    parents: parents
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|parent| AncestorRef {
                            event_id: parent.as_str().unwrap().to_string(),
                            archive_hash: format!("archive-{}", parent.as_str().unwrap()),
                        })
                        .collect(),
                },
            )
        })
        .collect();
    for fixture in section["ancestors"].as_array().unwrap() {
        let mut actual: Vec<_> = ancestor_ids(fixture["start"].as_str().unwrap(), &nodes)
            .into_iter()
            .collect();
        actual.sort();
        let expected: Vec<String> = serde_json::from_value(fixture["output"].clone()).unwrap();
        assert_eq!(actual, expected);
    }
    for fixture in section["isAncestor"].as_array().unwrap() {
        assert_eq!(
            is_ancestor(
                fixture["candidate"].as_str().unwrap(),
                fixture["descendant"].as_str().unwrap(),
                &nodes
            ),
            fixture["output"].as_bool().unwrap()
        );
    }
    for fixture in section["maximalHeads"].as_array().unwrap() {
        let heads: Vec<String> = serde_json::from_value(fixture["heads"].clone()).unwrap();
        let expected: Vec<String> = serde_json::from_value(fixture["output"].clone()).unwrap();
        assert_eq!(maximal_heads(&heads, &nodes), expected);
    }
    for fixture in section["nearestCommonAncestor"].as_array().unwrap() {
        assert_eq!(
            nearest_common_ancestor(
                fixture["left"].as_str().unwrap(),
                fixture["right"].as_str().unwrap(),
                &nodes
            ),
            fixture["output"].as_str().map(ToOwned::to_owned)
        );
    }
}

#[test]
fn revision_readers_match_complete_outputs_and_failures() {
    let fixtures = fixtures();
    let section = &fixtures["revisionReaders"];
    for fixture in section["successes"].as_array().unwrap() {
        let actual = match fixture["type"].as_str().unwrap() {
            "revision" => {
                serde_json::to_value(parse_revision_payload(&fixture["input"]).unwrap()).unwrap()
            }
            "head" => serde_json::to_value(parse_head_payload(&fixture["input"]).unwrap()).unwrap(),
            _ => unreachable!(),
        };
        assert_eq!(actual, fixture["output"], "{}", fixture["name"]);
    }
    for fixture in section["failures"].as_array().unwrap() {
        let failed = match fixture["type"].as_str().unwrap() {
            "revision" => parse_revision_payload(&fixture["input"]).is_err(),
            "head" => parse_head_payload(&fixture["input"]).is_err(),
            _ => unreachable!(),
        };
        assert!(failed, "{}", fixture["name"]);
    }
}

#[test]
fn membership_authority_matches_cutoff_outputs_and_failures() {
    let fixtures = fixtures();
    let section = &fixtures["membershipAuthority"];
    let membership: HistoryMembership =
        serde_json::from_value(section["membership"].clone()).unwrap();
    validate_membership(
        &membership,
        &membership.vault_id,
        &membership.owner_public_key,
    )
    .unwrap();
    let epochs: Vec<u32> = serde_json::from_value(section["installedEpochs"].clone()).unwrap();
    let ancestry: HashMap<String, Vec<String>> =
        serde_json::from_value(section["ancestry"].clone()).unwrap();
    let is_ancestor_or_equal = |candidate: &str, descendant: &str| {
        let mut pending = vec![descendant.to_string()];
        let mut seen = std::collections::HashSet::new();
        while let Some(id) = pending.pop() {
            if !seen.insert(id.clone()) {
                continue;
            }
            if id == candidate {
                return true;
            }
            pending.extend(ancestry.get(&id).cloned().unwrap_or_default());
        }
        false
    };
    for fixture in section["cases"].as_array().unwrap() {
        let record: MembershipAuthorizationRecord =
            serde_json::from_value(fixture["record"].clone()).unwrap();
        assert_eq!(
            authorize_membership_record(&membership, &epochs, &record, is_ancestor_or_equal)
                .unwrap(),
            fixture["authorized"].as_bool().unwrap(),
            "{}",
            fixture["name"]
        );
    }
    for fixture in section["invalidMemberships"].as_array().unwrap() {
        let mut invalid = membership.clone();
        let patch = &fixture["patch"];
        if patch["duplicateFirstDevice"].as_bool() == Some(true) {
            invalid.devices.push(invalid.devices[0].clone());
        }
        if let Some(generation) = patch["activeIdentityGeneration"].as_u64() {
            invalid.sync_identity.as_mut().unwrap().generation = generation as u32;
        }
        if let Some(generation) = patch["retireActiveIdentityAt"].as_u64() {
            let identity = invalid.sync_identity.as_mut().unwrap();
            let public_key = identity.public_key.clone();
            identity
                .history
                .iter_mut()
                .find(|entry| entry.public_key == public_key)
                .unwrap()
                .retired_membership_generation = Some(generation as u32);
        }
        assert!(
            validate_membership(&invalid, &invalid.vault_id, &invalid.owner_public_key).is_err(),
            "{}",
            fixture["name"]
        );
    }
}

#[test]
fn cryptographic_primitives_match_complete_outputs() {
    let fixtures = fixtures();
    let crypto = &fixtures["crypto"];
    assert_eq!(
        hex::encode(sha256(
            crypto["sha256"]["inputUtf8"].as_str().unwrap().as_bytes()
        )),
        crypto["sha256"]["outputHex"].as_str().unwrap()
    );
    assert_eq!(
        hex::encode(
            hkdf_sha256(
                crypto["hkdfSha256"]["ikmUtf8"].as_str().unwrap().as_bytes(),
                Some(
                    crypto["hkdfSha256"]["saltUtf8"]
                        .as_str()
                        .unwrap()
                        .as_bytes()
                ),
                crypto["hkdfSha256"]["infoUtf8"]
                    .as_str()
                    .unwrap()
                    .as_bytes(),
            )
            .unwrap()
        ),
        crypto["hkdfSha256"]["outputHex"].as_str().unwrap()
    );
    assert_eq!(
        hex::encode(
            hmac_sha256(
                crypto["hmacSha256"]["keyUtf8"].as_str().unwrap().as_bytes(),
                crypto["hmacSha256"]["inputUtf8"]
                    .as_str()
                    .unwrap()
                    .as_bytes(),
            )
            .unwrap()
        ),
        crypto["hmacSha256"]["outputHex"].as_str().unwrap()
    );
    let xchacha = &crypto["xchacha20poly1305"];
    let key: [u8; 32] = hex::decode(xchacha["keyHex"].as_str().unwrap())
        .unwrap()
        .try_into()
        .unwrap();
    let nonce: [u8; 24] = hex::decode(xchacha["nonceHex"].as_str().unwrap())
        .unwrap()
        .try_into()
        .unwrap();
    assert_eq!(
        hex::encode(
            xchacha20poly1305_encrypt(
                &key,
                &nonce,
                xchacha["plaintextUtf8"].as_str().unwrap().as_bytes(),
                Some(&hex::decode(xchacha["aadHex"].as_str().unwrap()).unwrap()),
            )
            .unwrap()
        ),
        xchacha["ciphertextHex"].as_str().unwrap()
    );
}

#[test]
fn signed_wire_and_attestation_outputs_match() {
    let fixtures = fixtures();
    let wire = wire();
    for name in fixtures["wire"]["validSignedEvents"].as_array().unwrap() {
        verify_signed_event(&as_event(&wire[name.as_str().unwrap()])).unwrap();
    }
    for fixture in fixtures["wire"]["deviceEnvelopes"].as_array().unwrap() {
        let result = unwrap_device_transport_event(
            &as_event(&wire[fixture["event"].as_str().unwrap()]),
            fixture["kind"].as_u64().unwrap() as u32,
        )
        .unwrap();
        assert_eq!(result.legacy, fixture["legacy"].as_bool().unwrap());
        assert_eq!(
            result.attested_event.pubkey,
            fixture["attestedPubkey"].as_str().unwrap()
        );
    }
    for fixture in fixtures["wire"]["rootEnvelopes"].as_array().unwrap() {
        let result =
            unwrap_root_authority_event(&as_event(&wire[fixture["event"].as_str().unwrap()]))
                .unwrap();
        assert_eq!(result.legacy, fixture["legacy"].as_bool().unwrap());
        assert_eq!(
            result.attested_event.pubkey,
            fixture["attestedPubkey"].as_str().unwrap()
        );
    }
}
