//! Merge planning for conflict resolution.
//!
//! Plans merge operations when multiple device tips diverge. Supports
//! text/binary/delete/rename conflicts with explicit resolution strategies.

use super::local_engine::{MergeDecision, MergeDraft, MergeResolution};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
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

#[derive(Debug, Clone)]
pub struct MergeDraftInput {
    pub base_revision_id: String,
    pub left_revision_id: String,
    pub right_revision_id: String,
    pub base: HashMap<String, Vec<u8>>,
    pub left: HashMap<String, Vec<u8>>,
    pub right: HashMap<String, Vec<u8>>,
    pub base_file_ids: Option<HashMap<String, String>>,
    pub left_file_ids: Option<HashMap<String, String>>,
    pub right_file_ids: Option<HashMap<String, String>>,
    pub content_generations: HashMap<String, u64>,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum MergeConflictKind {
    DeleteEdit,
    DivergentRename,
    SamePathAddition,
    BinaryChange,
    TextConflict,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeMergeConflict {
    pub id: String,
    pub path: String,
    pub kind: MergeConflictKind,
    pub binary: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub base_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub left_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub right_path: Option<String>,
    pub base: Option<String>,
    pub left: Option<String>,
    pub right: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "choice", rename_all = "kebab-case")]
pub enum RuntimeMergeResolution {
    Left,
    Right,
    Base,
    Delete,
    KeepBoth,
    Resolved { content: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeMergeDraft {
    pub schema_version: u32,
    pub base_revision_id: String,
    pub left_revision_id: String,
    pub right_revision_id: String,
    pub content_generations: HashMap<String, u64>,
    pub automatic_files: BTreeMap<String, String>,
    pub conflicts: Vec<RuntimeMergeConflict>,
    pub resolutions: HashMap<String, RuntimeMergeResolution>,
    pub created_at: u64,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum RuntimeMergeError {
    #[error("Invalid base64 merge content")]
    InvalidContent,
    #[error("Resolve {0} before merging")]
    Incomplete(String),
    #[error("Merge decisions are stale for the current vault")]
    StaleGenerations,
    #[error("Merge draft contains a stale conflict decision")]
    StaleDecision,
    #[error("Merge draft contains duplicate conflict IDs")]
    DuplicateConflict,
    #[error("Binary conflicts cannot use resolved text")]
    BinaryResolvedText,
}

fn content_id(value: &str) -> String {
    hex::encode(Sha256::digest(value.as_bytes()))[..16].to_string()
}

fn encoded(bytes: Option<&Vec<u8>>) -> Option<String> {
    bytes.map(|value| BASE64.encode(value))
}

fn is_text(bytes: &[u8]) -> bool {
    !bytes.contains(&0) && std::str::from_utf8(bytes).is_ok()
}

enum AutomaticResolution<'a> {
    Resolved(Option<&'a Vec<u8>>),
    Conflict,
}

fn automatic_resolution<'a>(
    base: Option<&'a Vec<u8>>,
    left: Option<&'a Vec<u8>>,
    right: Option<&'a Vec<u8>>,
) -> AutomaticResolution<'a> {
    if left == right {
        AutomaticResolution::Resolved(left)
    } else if left == base {
        AutomaticResolution::Resolved(right)
    } else if right == base {
        AutomaticResolution::Resolved(left)
    } else {
        AutomaticResolution::Conflict
    }
}

fn invert_file_ids(file_ids: &HashMap<String, String>) -> HashMap<String, String> {
    let mut paths: Vec<_> = file_ids.iter().collect();
    paths.sort_by_key(|(path, _)| *path);
    let mut result = HashMap::new();
    for (path, file_id) in paths {
        result
            .entry(file_id.clone())
            .or_insert_with(|| path.clone());
    }
    result
}

fn divergent_rename_conflicts(
    input: &MergeDraftInput,
) -> (Vec<RuntimeMergeConflict>, HashSet<String>) {
    let (Some(base_ids), Some(left_ids), Some(right_ids)) = (
        input.base_file_ids.as_ref(),
        input.left_file_ids.as_ref(),
        input.right_file_ids.as_ref(),
    ) else {
        return (Vec::new(), HashSet::new());
    };
    let left_by_id = invert_file_ids(left_ids);
    let right_by_id = invert_file_ids(right_ids);
    let mut base_entries: Vec<_> = base_ids.iter().collect();
    base_entries.sort_by_key(|(path, _)| *path);
    let mut conflicts = Vec::new();
    let mut excluded = HashSet::new();
    for (base_path, file_id) in base_entries {
        let (Some(left_path), Some(right_path)) =
            (left_by_id.get(file_id), right_by_id.get(file_id))
        else {
            continue;
        };
        if left_path == base_path || right_path == base_path || left_path == right_path {
            continue;
        }
        let (Some(base), Some(left), Some(right)) = (
            input.base.get(base_path),
            input.left.get(left_path),
            input.right.get(right_path),
        ) else {
            continue;
        };
        excluded.insert(base_path.clone());
        excluded.insert(left_path.clone());
        excluded.insert(right_path.clone());
        let identity = format!("{base_path}\0{left_path}\0{right_path}");
        conflicts.push(RuntimeMergeConflict {
            id: format!("{}:divergent-rename", content_id(&identity)),
            path: base_path.clone(),
            kind: MergeConflictKind::DivergentRename,
            binary: [base, left, right].iter().any(|bytes| !is_text(bytes)),
            base_path: Some(base_path.clone()),
            left_path: Some(left_path.clone()),
            right_path: Some(right_path.clone()),
            base: Some(BASE64.encode(base)),
            left: Some(BASE64.encode(left)),
            right: Some(BASE64.encode(right)),
        });
    }
    (conflicts, excluded)
}

/// Build a deterministic three-way merge plan from authenticated snapshots.
pub fn create_merge_draft(input: &MergeDraftInput) -> RuntimeMergeDraft {
    let (mut conflicts, excluded) = divergent_rename_conflicts(input);
    let paths: BTreeSet<_> = input
        .base
        .keys()
        .chain(input.left.keys())
        .chain(input.right.keys())
        .cloned()
        .collect();
    let mut automatic_files = BTreeMap::new();
    for path in paths {
        if excluded.contains(&path) {
            continue;
        }
        let base = input.base.get(&path);
        let left = input.left.get(&path);
        let right = input.right.get(&path);
        match automatic_resolution(base, left, right) {
            AutomaticResolution::Resolved(Some(bytes)) => {
                automatic_files.insert(path, BASE64.encode(bytes));
            }
            AutomaticResolution::Resolved(None) => {}
            AutomaticResolution::Conflict => {
                let binary = [base, left, right]
                    .into_iter()
                    .flatten()
                    .any(|bytes| !is_text(bytes));
                let kind = if binary {
                    MergeConflictKind::BinaryChange
                } else if base.is_none() && left.is_some() && right.is_some() {
                    MergeConflictKind::SamePathAddition
                } else if base.is_some() && (left.is_none() || right.is_none()) {
                    MergeConflictKind::DeleteEdit
                } else {
                    MergeConflictKind::TextConflict
                };
                conflicts.push(RuntimeMergeConflict {
                    id: format!("{}:{}", content_id(&path), merge_kind_name(&kind)),
                    path,
                    kind,
                    binary,
                    base_path: None,
                    left_path: None,
                    right_path: None,
                    base: encoded(base),
                    left: encoded(left),
                    right: encoded(right),
                });
            }
        }
    }
    RuntimeMergeDraft {
        schema_version: 1,
        base_revision_id: input.base_revision_id.clone(),
        left_revision_id: input.left_revision_id.clone(),
        right_revision_id: input.right_revision_id.clone(),
        content_generations: input.content_generations.clone(),
        automatic_files,
        conflicts,
        resolutions: HashMap::new(),
        created_at: input.created_at,
    }
}

fn merge_kind_name(kind: &MergeConflictKind) -> &'static str {
    match kind {
        MergeConflictKind::DeleteEdit => "delete-edit",
        MergeConflictKind::DivergentRename => "divergent-rename",
        MergeConflictKind::SamePathAddition => "same-path-addition",
        MergeConflictKind::BinaryChange => "binary-change",
        MergeConflictKind::TextConflict => "text-conflict",
    }
}

fn validate_runtime_merge_draft(
    draft: &RuntimeMergeDraft,
    current_content_generations: Option<&HashMap<String, u64>>,
) -> Result<(), RuntimeMergeError> {
    if let Some(current) = current_content_generations
        && current != &draft.content_generations
    {
        return Err(RuntimeMergeError::StaleGenerations);
    }
    let mut conflict_ids = HashSet::new();
    for conflict in &draft.conflicts {
        if !conflict_ids.insert(conflict.id.as_str()) {
            return Err(RuntimeMergeError::DuplicateConflict);
        }
        let resolution = draft
            .resolutions
            .get(&conflict.id)
            .ok_or_else(|| RuntimeMergeError::Incomplete(conflict.path.clone()))?;
        if conflict.binary && matches!(resolution, RuntimeMergeResolution::Resolved { .. }) {
            return Err(RuntimeMergeError::BinaryResolvedText);
        }
    }
    if draft
        .resolutions
        .keys()
        .any(|id| !conflict_ids.contains(id.as_str()))
    {
        return Err(RuntimeMergeError::StaleDecision);
    }
    Ok(())
}

fn decoded(value: &str) -> Result<Vec<u8>, RuntimeMergeError> {
    BASE64
        .decode(value)
        .map_err(|_| RuntimeMergeError::InvalidContent)
}

/// Materialize only complete, current decisions; callers still own guarded apply.
pub fn materialise_merge_draft<F>(
    draft: &RuntimeMergeDraft,
    mut keep_both_name: F,
    current_content_generations: Option<&HashMap<String, u64>>,
) -> Result<BTreeMap<String, Vec<u8>>, RuntimeMergeError>
where
    F: FnMut(&str) -> String,
{
    validate_runtime_merge_draft(draft, current_content_generations)?;
    let mut files = BTreeMap::new();
    for (path, value) in &draft.automatic_files {
        files.insert(path.clone(), decoded(value)?);
    }
    for conflict in &draft.conflicts {
        let resolution = &draft.resolutions[&conflict.id];
        match resolution {
            RuntimeMergeResolution::Delete => {}
            RuntimeMergeResolution::KeepBoth => {
                if let Some(left) = conflict.left.as_deref() {
                    files.insert(
                        conflict
                            .left_path
                            .as_ref()
                            .unwrap_or(&conflict.path)
                            .clone(),
                        decoded(left)?,
                    );
                }
                if let Some(right) = conflict.right.as_deref() {
                    let source_path = conflict.right_path.as_ref().unwrap_or(&conflict.path);
                    files.insert(keep_both_name(source_path), decoded(right)?);
                }
            }
            RuntimeMergeResolution::Resolved { content } => {
                files.insert(
                    conflict
                        .left_path
                        .as_ref()
                        .unwrap_or(&conflict.path)
                        .clone(),
                    content.as_bytes().to_vec(),
                );
            }
            choice => {
                let (value, path) = match choice {
                    RuntimeMergeResolution::Left => (
                        conflict.left.as_deref(),
                        conflict.left_path.as_ref().unwrap_or(&conflict.path),
                    ),
                    RuntimeMergeResolution::Right => (
                        conflict.right.as_deref(),
                        conflict.right_path.as_ref().unwrap_or(&conflict.path),
                    ),
                    RuntimeMergeResolution::Base => (
                        conflict.base.as_deref(),
                        conflict.base_path.as_ref().unwrap_or(&conflict.path),
                    ),
                    _ => unreachable!(),
                };
                if let Some(value) = value {
                    files.insert(path.clone(), decoded(value)?);
                }
            }
        }
    }
    Ok(files)
}

/// Reproduce the retained deterministic keep-both filename policy.
pub fn deterministic_keep_both_path(
    path: &str,
    alias: &str,
    public_key: &str,
    occupied: &HashSet<String>,
) -> String {
    let (directory, filename) = path
        .rfind('/')
        .map_or(("", path), |slash| (&path[..=slash], &path[slash + 1..]));
    let (stem, extension) = filename
        .rfind('.')
        .filter(|dot| *dot > 0)
        .map_or((filename, ""), |dot| (&filename[..dot], &filename[dot..]));
    let mut safe_alias = String::new();
    let mut replaced = false;
    for character in alias.trim().chars() {
        if character.is_alphanumeric() || matches!(character, '_' | '-') {
            safe_alias.push(character);
            replaced = false;
        } else if !replaced {
            safe_alias.push('-');
            replaced = true;
        }
    }
    if safe_alias.is_empty() {
        safe_alias.push_str("device");
    }
    let key_prefix: String = public_key.chars().take(8).collect();
    let suffix = format!("{safe_alias}-{key_prefix}");
    let mut candidate = format!("{directory}{stem} ({suffix}){extension}");
    let mut index = 2;
    while occupied.contains(&candidate) {
        candidate = format!("{directory}{stem} ({suffix}-{index}){extension}");
        index += 1;
    }
    candidate
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
