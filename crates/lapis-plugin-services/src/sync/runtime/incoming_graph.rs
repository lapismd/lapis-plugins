//! Pure dependency validation for authenticated incoming history.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IncomingParent {
    pub event_id: String,
    pub archive_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IncomingRevisionNode {
    pub archive_hash: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub archive_aliases: Vec<String>,
    pub root: String,
    pub parents: Vec<IncomingParent>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IncomingHeadReference {
    pub revision_event_id: String,
    pub revision_archive_hash: String,
    pub root: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AuthenticatedHistoryGraph {
    pub revisions: HashMap<String, IncomingRevisionNode>,
    pub heads: Vec<IncomingHeadReference>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ValidatedHistoryGraph {
    pub revision_ids: Vec<String>,
    pub head_revision_ids: Vec<String>,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum IncomingGraphError {
    #[error("Cyclic incoming ancestry")]
    Cycle,
    #[error("Incoming revision dependency is missing")]
    MissingRevision,
    #[error("Invalid incoming revision graph")]
    InvalidRevision,
    #[error("Incoming parent archive reference mismatch")]
    ParentArchiveMismatch,
    #[error("Incoming HEAD dependency is missing")]
    MissingHeadRevision,
    #[error("Incoming HEAD does not match its revision")]
    HeadMismatch,
}

pub fn validate_authenticated_history_graph(
    graph: &AuthenticatedHistoryGraph,
) -> Result<ValidatedHistoryGraph, IncomingGraphError> {
    let mut revision_ids: Vec<_> = graph.revisions.keys().cloned().collect();
    revision_ids.sort();
    let mut visiting = HashSet::new();
    let mut visited = HashSet::new();
    for id in &revision_ids {
        visit(id, graph, &mut visiting, &mut visited)?;
    }
    let mut head_revision_ids = Vec::with_capacity(graph.heads.len());
    for head in &graph.heads {
        let revision = graph
            .revisions
            .get(&head.revision_event_id)
            .ok_or(IncomingGraphError::MissingHeadRevision)?;
        if revision.archive_hash != head.revision_archive_hash || revision.root != head.root {
            return Err(IncomingGraphError::HeadMismatch);
        }
        head_revision_ids.push(head.revision_event_id.clone());
    }
    Ok(ValidatedHistoryGraph {
        revision_ids,
        head_revision_ids,
    })
}

fn visit(
    id: &str,
    graph: &AuthenticatedHistoryGraph,
    visiting: &mut HashSet<String>,
    visited: &mut HashSet<String>,
) -> Result<(), IncomingGraphError> {
    if visited.contains(id) {
        return Ok(());
    }
    if !visiting.insert(id.to_string()) {
        return Err(IncomingGraphError::Cycle);
    }
    let revision = graph
        .revisions
        .get(id)
        .ok_or(IncomingGraphError::MissingRevision)?;
    if !is_hash(id)
        || !is_hash(&revision.archive_hash)
        || !is_hash(&revision.root)
        || revision.parents.len() > 64
        || revision.archive_aliases.iter().any(|alias| !is_hash(alias))
        || revision
            .parents
            .iter()
            .map(|parent| &parent.event_id)
            .collect::<HashSet<_>>()
            .len()
            != revision.parents.len()
    {
        return Err(IncomingGraphError::InvalidRevision);
    }
    for parent in &revision.parents {
        let dependency = graph
            .revisions
            .get(&parent.event_id)
            .ok_or(IncomingGraphError::MissingRevision)?;
        if dependency.archive_hash != parent.archive_hash
            && !dependency.archive_aliases.contains(&parent.archive_hash)
        {
            return Err(IncomingGraphError::ParentArchiveMismatch);
        }
        visit(&parent.event_id, graph, visiting, visited)?;
    }
    visiting.remove(id);
    visited.insert(id.to_string());
    Ok(())
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

    #[test]
    fn accepts_verified_archive_alias() {
        let id = "0".repeat(64);
        let primary = "a".repeat(64);
        let alias = "b".repeat(64);
        let root = "c".repeat(64);
        let graph = AuthenticatedHistoryGraph {
            revisions: HashMap::from([(
                id.clone(),
                IncomingRevisionNode {
                    archive_hash: primary,
                    archive_aliases: vec![alias.clone()],
                    root: root.clone(),
                    parents: vec![],
                },
            )]),
            heads: vec![],
        };
        validate_authenticated_history_graph(&graph).unwrap();
        assert_eq!(graph.revisions[&id].archive_aliases, vec![alias]);
    }
}
