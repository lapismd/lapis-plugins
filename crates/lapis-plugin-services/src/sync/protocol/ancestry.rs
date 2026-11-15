//! Revision ancestry tracking and traversal.
//!
//! Provides algorithms for traversing revision DAGs, finding ancestors,
//! computing maximal heads, and locating common ancestors.

use std::collections::{HashMap, HashSet, VecDeque};

/// A node in the revision DAG.
#[derive(Debug, Clone)]
pub struct RevisionNode {
    pub event_id: String,
    pub parents: Vec<AncestorRef>,
}

/// A parent reference in the revision DAG.
#[derive(Debug, Clone)]
pub struct AncestorRef {
    pub event_id: String,
    pub archive_hash: String,
}

/// Compute all ancestor event IDs from a starting node.
///
/// Performs a depth-first traversal and returns all reachable ancestors
/// (including the start node itself).
pub fn ancestor_ids(start: &str, nodes: &HashMap<String, RevisionNode>) -> HashSet<String> {
    let mut seen = HashSet::new();
    let mut stack = vec![start.to_string()];

    while let Some(id) = stack.pop() {
        if !seen.insert(id.clone()) {
            continue;
        }
        if let Some(node) = nodes.get(&id) {
            for parent in &node.parents {
                stack.push(parent.event_id.clone());
            }
        }
    }

    seen
}

/// Check if a candidate event is an ancestor of a descendant.
pub fn is_ancestor(
    candidate: &str,
    descendant: &str,
    nodes: &HashMap<String, RevisionNode>,
) -> bool {
    ancestor_ids(descendant, nodes).contains(candidate)
}

/// Filter a set of head IDs to only those that are maximal.
///
/// A head is maximal if no other head in the set is a descendant of it.
/// This removes heads that are ancestors of other heads in the set.
pub fn maximal_heads(head_ids: &[String], nodes: &HashMap<String, RevisionNode>) -> Vec<String> {
    head_ids
        .iter()
        .filter(|id| {
            !head_ids
                .iter()
                .any(|other| other != *id && is_ancestor(id, other, nodes))
        })
        .cloned()
        .collect()
}

/// Find the nearest common ancestor of two events.
///
/// Performs a breadth-first search from `right` and returns the first
/// event that is also an ancestor of `left`. Returns `None` if no
/// common ancestor exists.
pub fn nearest_common_ancestor(
    left: &str,
    right: &str,
    nodes: &HashMap<String, RevisionNode>,
) -> Option<String> {
    let left_ancestors = ancestor_ids(left, nodes);
    let mut queue = VecDeque::new();
    let mut seen = HashSet::new();

    queue.push_back(right.to_string());

    while let Some(id) = queue.pop_front() {
        if !seen.insert(id.clone()) {
            continue;
        }
        if left_ancestors.contains(&id) {
            return Some(id);
        }
        if let Some(node) = nodes.get(&id) {
            for parent in &node.parents {
                queue.push_back(parent.event_id.clone());
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_node(id: &str, parents: Vec<&str>) -> RevisionNode {
        RevisionNode {
            event_id: id.to_string(),
            parents: parents
                .into_iter()
                .map(|p| AncestorRef {
                    event_id: p.to_string(),
                    archive_hash: "hash".to_string(),
                })
                .collect(),
        }
    }

    #[test]
    fn test_ancestor_ids_linear() {
        // A -> B -> C
        let mut nodes = HashMap::new();
        nodes.insert("C".to_string(), make_node("C", vec!["B"]));
        nodes.insert("B".to_string(), make_node("B", vec!["A"]));
        nodes.insert("A".to_string(), make_node("A", vec![]));

        let ancestors = ancestor_ids("C", &nodes);
        assert!(ancestors.contains("A"));
        assert!(ancestors.contains("B"));
        assert!(ancestors.contains("C"));
        assert_eq!(ancestors.len(), 3);
    }

    #[test]
    fn test_ancestor_ids_diamond() {
        //   A
        //  / \
        // B   C
        //  \ /
        //   D
        let mut nodes = HashMap::new();
        nodes.insert("D".to_string(), make_node("D", vec!["B", "C"]));
        nodes.insert("B".to_string(), make_node("B", vec!["A"]));
        nodes.insert("C".to_string(), make_node("C", vec!["A"]));
        nodes.insert("A".to_string(), make_node("A", vec![]));

        let ancestors = ancestor_ids("D", &nodes);
        assert!(ancestors.contains("A"));
        assert!(ancestors.contains("B"));
        assert!(ancestors.contains("C"));
        assert!(ancestors.contains("D"));
        assert_eq!(ancestors.len(), 4);
    }

    #[test]
    fn test_is_ancestor() {
        let mut nodes = HashMap::new();
        nodes.insert("C".to_string(), make_node("C", vec!["B"]));
        nodes.insert("B".to_string(), make_node("B", vec!["A"]));
        nodes.insert("A".to_string(), make_node("A", vec![]));

        assert!(is_ancestor("A", "C", &nodes));
        assert!(is_ancestor("B", "C", &nodes));
        assert!(!is_ancestor("C", "A", &nodes));
    }

    #[test]
    fn test_maximal_heads() {
        // A -> B -> C (C is descendant of A)
        let mut nodes = HashMap::new();
        nodes.insert("C".to_string(), make_node("C", vec!["B"]));
        nodes.insert("B".to_string(), make_node("B", vec!["A"]));
        nodes.insert("A".to_string(), make_node("A", vec![]));

        let heads = vec!["A".to_string(), "C".to_string()];
        let maximal = maximal_heads(&heads, &nodes);
        assert_eq!(maximal, vec!["C"]);
    }

    #[test]
    fn test_maximal_heads_divergent() {
        //   A
        //  / \
        // B   C
        let mut nodes = HashMap::new();
        nodes.insert("B".to_string(), make_node("B", vec!["A"]));
        nodes.insert("C".to_string(), make_node("C", vec!["A"]));
        nodes.insert("A".to_string(), make_node("A", vec![]));

        let heads = vec!["B".to_string(), "C".to_string()];
        let maximal = maximal_heads(&heads, &nodes);
        assert_eq!(maximal.len(), 2);
        assert!(maximal.contains(&"B".to_string()));
        assert!(maximal.contains(&"C".to_string()));
    }

    #[test]
    fn test_nearest_common_ancestor() {
        //   A
        //  / \
        // B   C
        let mut nodes = HashMap::new();
        nodes.insert("B".to_string(), make_node("B", vec!["A"]));
        nodes.insert("C".to_string(), make_node("C", vec!["A"]));
        nodes.insert("A".to_string(), make_node("A", vec![]));

        assert_eq!(
            nearest_common_ancestor("B", "C", &nodes),
            Some("A".to_string())
        );
    }

    #[test]
    fn test_nearest_common_ancestor_none() {
        // A   B (disconnected)
        let mut nodes = HashMap::new();
        nodes.insert("A".to_string(), make_node("A", vec![]));
        nodes.insert("B".to_string(), make_node("B", vec![]));

        assert_eq!(nearest_common_ancestor("A", "B", &nodes), None);
    }

    #[test]
    fn test_nearest_common_ancestor_same() {
        let mut nodes = HashMap::new();
        nodes.insert("A".to_string(), make_node("A", vec![]));

        assert_eq!(
            nearest_common_ancestor("A", "A", &nodes),
            Some("A".to_string())
        );
    }
}
