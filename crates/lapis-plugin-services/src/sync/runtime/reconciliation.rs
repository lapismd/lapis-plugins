//! Pure ancestry-based reconciliation planning.

use crate::sync::protocol::{RevisionNode, ancestor_ids, maximal_heads};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum ReconciliationPlan {
    Clean {
        tips: Vec<String>,
    },
    LocalChanges {
        tips: Vec<String>,
    },
    FastForward {
        tips: Vec<String>,
        #[serde(rename = "targetRevisionId")]
        target_revision_id: String,
    },
    MergeRequired {
        tips: Vec<String>,
        #[serde(rename = "leftRevisionId")]
        left_revision_id: String,
        #[serde(rename = "rightRevisionId")]
        right_revision_id: String,
        #[serde(rename = "baseRevisionId")]
        base_revision_id: String,
    },
    Unrelated {
        tips: Vec<String>,
        #[serde(rename = "leftRevisionId")]
        left_revision_id: String,
        #[serde(rename = "rightRevisionId")]
        right_revision_id: String,
    },
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ReconciliationError {
    #[error("Tip has missing ancestry")]
    MissingTip,
    #[error("Unsupported history: multiple incomparable merge bases")]
    MultipleMergeBases,
}

pub fn plan_reconciliation_graph(
    local_revision_id: Option<&str>,
    remote_revision_ids: &[String],
    nodes: &HashMap<String, RevisionNode>,
    local_changes: bool,
) -> Result<ReconciliationPlan, ReconciliationError> {
    let mut tip_set: HashSet<String> = remote_revision_ids.iter().cloned().collect();
    if let Some(local) = local_revision_id {
        tip_set.insert(local.to_string());
    }
    if tip_set.iter().any(|id| !nodes.contains_key(id)) {
        return Err(ReconciliationError::MissingTip);
    }
    let mut tips = maximal_heads(&tip_set.into_iter().collect::<Vec<_>>(), nodes);
    tips.sort();
    if local_changes {
        return Ok(ReconciliationPlan::LocalChanges { tips });
    }
    if tips.is_empty() || (tips.len() == 1 && tips.first().map(String::as_str) == local_revision_id)
    {
        return Ok(ReconciliationPlan::Clean { tips });
    }
    if tips.len() == 1 {
        return Ok(ReconciliationPlan::FastForward {
            target_revision_id: tips[0].clone(),
            tips,
        });
    }
    let left = local_revision_id
        .filter(|local| tips.iter().any(|tip| tip == local))
        .unwrap_or(&tips[0])
        .to_string();
    let right = tips
        .iter()
        .find(|tip| **tip != left)
        .expect("at least two tips")
        .clone();
    match single_lowest_common_ancestor(&left, &right, nodes)? {
        Some(base_revision_id) => Ok(ReconciliationPlan::MergeRequired {
            tips,
            left_revision_id: left,
            right_revision_id: right,
            base_revision_id,
        }),
        None => Ok(ReconciliationPlan::Unrelated {
            tips,
            left_revision_id: left,
            right_revision_id: right,
        }),
    }
}

fn single_lowest_common_ancestor(
    left: &str,
    right: &str,
    nodes: &HashMap<String, RevisionNode>,
) -> Result<Option<String>, ReconciliationError> {
    let left_ancestors = ancestor_ids(left, nodes);
    let right_ancestors = ancestor_ids(right, nodes);
    let common: Vec<_> = left_ancestors
        .intersection(&right_ancestors)
        .cloned()
        .collect();
    if common.is_empty() {
        return Ok(None);
    }
    let lowest: Vec<_> = common
        .iter()
        .filter(|candidate| {
            !common
                .iter()
                .any(|other| other != *candidate && ancestor_ids(other, nodes).contains(*candidate))
        })
        .cloned()
        .collect();
    if lowest.len() != 1 {
        return Err(ReconciliationError::MultipleMergeBases);
    }
    Ok(lowest.into_iter().next())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sync::protocol::AncestorRef;

    fn node(id: &str, parents: &[&str]) -> (String, RevisionNode) {
        (
            id.to_string(),
            RevisionNode {
                event_id: id.to_string(),
                parents: parents
                    .iter()
                    .map(|parent| AncestorRef {
                        event_id: (*parent).to_string(),
                        archive_hash: String::new(),
                    })
                    .collect(),
            },
        )
    }

    #[test]
    fn reports_fast_forward() {
        let nodes = HashMap::from([node("a", &[]), node("b", &["a"])]);
        assert_eq!(
            plan_reconciliation_graph(Some("a"), &["b".into()], &nodes, false).unwrap(),
            ReconciliationPlan::FastForward {
                tips: vec!["b".into()],
                target_revision_id: "b".into(),
            }
        );
    }
}
