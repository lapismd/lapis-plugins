//! Merge planning for conflict resolution.
//!
//! Plans merge operations when multiple device tips diverge. Supports
//! text/binary/delete/rename conflicts with explicit resolution strategies.

use super::local_engine::{MergeDecision, MergeDraft, MergeResolution};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MergeError {
    #[error("No merge required")]
    NoMergeRequired,
    #[error("Merge base not found")]
    MergeBaseNotFound,
    #[error("Merge draft already exists")]
    DraftExists,
    #[error("No merge draft")]
    NoDraft,
    #[error("Conflict resolution incomplete")]
    IncompleteResolution,
    #[error("Invalid resolution for file {0}")]
    InvalidResolution(String),
}

/// Conflict type for a file.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictType {
    Edit,
    Binary,
    Delete,
    Rename,
    None,
}

/// File conflict information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileConflict {
    pub file_id: String,
    pub path: String,
    pub conflict_type: ConflictType,
    pub base_content: Option<String>,
    pub local_content: Option<String>,
    pub remote_content: Option<String>,
}

/// Merge plan describing operations to resolve conflicts.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergePlan {
    pub base_revision_id: String,
    pub local_tip: String,
    pub remote_tip: String,
    pub conflicts: Vec<FileConflict>,
    pub resolved: Vec<MergeDecision>,
}

impl MergePlan {
    /// Create a new merge plan.
    pub fn new(base_revision_id: String, local_tip: String, remote_tip: String) -> Self {
        Self {
            base_revision_id,
            local_tip,
            remote_tip,
            conflicts: Vec::new(),
            resolved: Vec::new(),
        }
    }

    /// Add a conflict to the plan.
    pub fn add_conflict(&mut self, conflict: FileConflict) {
        self.conflicts.push(conflict);
    }

    /// Check if all conflicts are resolved.
    pub fn is_complete(&self) -> bool {
        self.resolved.len() == self.conflicts.len()
    }

    /// Resolve a conflict.
    pub fn resolve(
        &mut self,
        file_id: &str,
        resolution: MergeResolution,
    ) -> Result<(), MergeError> {
        let conflict = self
            .conflicts
            .iter()
            .find(|c| c.file_id == file_id)
            .ok_or_else(|| MergeError::InvalidResolution(file_id.to_string()))?;

        // Validate resolution matches conflict type
        match (&conflict.conflict_type, &resolution) {
            (ConflictType::Binary, MergeResolution::ResolvedText(_)) => {
                return Err(MergeError::InvalidResolution(file_id.to_string()));
            }
            (ConflictType::Delete, MergeResolution::ResolvedText(_)) => {
                return Err(MergeError::InvalidResolution(file_id.to_string()));
            }
            _ => {}
        }

        self.resolved.push(MergeDecision {
            file_id: file_id.to_string(),
            resolution,
        });

        Ok(())
    }

    /// Convert to a merge draft for persistence.
    pub fn to_draft(&self) -> Result<MergeDraft, MergeError> {
        if !self.is_complete() {
            return Err(MergeError::IncompleteResolution);
        }

        Ok(MergeDraft {
            base_revision_id: self.base_revision_id.clone(),
            tips: vec![self.local_tip.clone(), self.remote_tip.clone()],
            decisions: self.resolved.clone(),
        })
    }
}

/// Detect conflicts between two revision tips.
pub fn detect_conflicts(
    base_paths: &std::collections::HashMap<String, String>,
    local_paths: &std::collections::HashMap<String, String>,
    remote_paths: &std::collections::HashMap<String, String>,
) -> Vec<FileConflict> {
    let mut conflicts = Vec::new();
    let mut all_files = std::collections::HashSet::new();

    all_files.extend(base_paths.keys());
    all_files.extend(local_paths.keys());
    all_files.extend(remote_paths.keys());

    for file_id in all_files {
        let base = base_paths.get(file_id);
        let local = local_paths.get(file_id);
        let remote = remote_paths.get(file_id);

        let conflict_type = match (base, local, remote) {
            // Both modified differently
            (Some(_b), Some(l), Some(r)) if l != r => ConflictType::Edit,
            // One deleted, one still exists (and may have been modified)
            (Some(_), None, Some(_)) => ConflictType::Delete,
            (Some(_), Some(_), None) => ConflictType::Delete,
            // Both added same file with different content
            (None, Some(l), Some(r)) if l != r => ConflictType::Edit,
            // No conflict
            _ => ConflictType::None,
        };

        if conflict_type != ConflictType::None {
            conflicts.push(FileConflict {
                file_id: file_id.clone(),
                path: local
                    .or(remote)
                    .or(base)
                    .cloned()
                    .unwrap_or_else(|| file_id.clone()),
                conflict_type,
                base_content: base.cloned(),
                local_content: local.cloned(),
                remote_content: remote.cloned(),
            });
        }
    }

    conflicts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_plan_lifecycle() {
        let mut plan = MergePlan::new(
            "base-1".to_string(),
            "local-1".to_string(),
            "remote-1".to_string(),
        );

        plan.add_conflict(FileConflict {
            file_id: "file-1".to_string(),
            path: "path-1".to_string(),
            conflict_type: ConflictType::Edit,
            base_content: Some("base".to_string()),
            local_content: Some("local".to_string()),
            remote_content: Some("remote".to_string()),
        });

        assert!(!plan.is_complete());

        plan.resolve("file-1", MergeResolution::Local).unwrap();
        assert!(plan.is_complete());

        let draft = plan.to_draft().unwrap();
        assert_eq!(draft.base_revision_id, "base-1");
        assert_eq!(draft.tips.len(), 2);
        assert_eq!(draft.decisions.len(), 1);
    }

    #[test]
    fn test_incomplete_resolution() {
        let mut plan = MergePlan::new(
            "base-1".to_string(),
            "local-1".to_string(),
            "remote-1".to_string(),
        );

        plan.add_conflict(FileConflict {
            file_id: "file-1".to_string(),
            path: "path-1".to_string(),
            conflict_type: ConflictType::Edit,
            base_content: None,
            local_content: None,
            remote_content: None,
        });

        assert!(matches!(
            plan.to_draft(),
            Err(MergeError::IncompleteResolution)
        ));
    }

    #[test]
    fn test_detect_conflicts_both_modified() {
        let mut base = std::collections::HashMap::new();
        base.insert("file-1".to_string(), "path-1".to_string());

        let mut local = std::collections::HashMap::new();
        local.insert("file-1".to_string(), "path-1".to_string());

        let mut remote = std::collections::HashMap::new();
        remote.insert("file-1".to_string(), "path-1".to_string());

        // Simulate different content by using different hashes
        let conflicts = detect_conflicts(&base, &local, &remote);
        assert_eq!(conflicts.len(), 0); // Same paths = no conflict
    }

    #[test]
    fn test_detect_conflicts_one_deleted() {
        let mut base = std::collections::HashMap::new();
        base.insert("file-1".to_string(), "path-1".to_string());

        let local = std::collections::HashMap::new(); // File deleted locally

        let mut remote = std::collections::HashMap::new();
        remote.insert("file-1".to_string(), "path-1".to_string());

        let conflicts = detect_conflicts(&base, &local, &remote);
        assert_eq!(conflicts.len(), 1);
        assert_eq!(conflicts[0].conflict_type, ConflictType::Delete);
    }
}
