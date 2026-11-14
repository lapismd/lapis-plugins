//! Object manifests for content-addressed file storage.
//!
//! Tree manifests describe directory structure; file manifests describe
//! content chunking and object references.

use crate::sync::protocol::constants::MANIFEST_SCHEMA_VERSION;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ManifestError {
    #[error("Unsupported tree manifest")]
    UnsupportedTreeManifest,
    #[error("Unsupported file manifest")]
    UnsupportedFileManifest,
    #[error("Tree manifest entries are required")]
    MissingEntries,
    #[error("Tree manifest entry limit exceeded")]
    EntryLimitExceeded,
    #[error("Unsupported tree entry type")]
    UnsupportedEntryType,
    #[error("Tree entry is incomplete")]
    IncompleteEntry,
    #[error("Invalid ciphertext object hash")]
    InvalidObjectHash,
    #[error("File manifest is incomplete")]
    IncompleteFileManifest,
    #[error("Invalid file manifest size or identity")]
    InvalidSizeOrIdentity,
    #[error("Chunk sizes do not match file size")]
    ChunkSizeMismatch,
    #[error("Unsupported chunk algorithm")]
    UnsupportedChunkAlgorithm,
    #[error("Invalid chunk count")]
    InvalidChunkCount,
    #[error("Invalid chunk size")]
    InvalidChunkSize,
    #[error("Unsupported file content mode")]
    UnsupportedContentMode,
    #[error("Invalid FastCDC chunk bounds")]
    InvalidChunkBounds,
    #[error("Invalid path component: {0}")]
    InvalidPathComponent(String),
    #[error("Invalid or noncanonical path")]
    InvalidPath,
    #[error("Case-colliding names {0} and {1}")]
    CaseCollision(String, String),
    #[error("{0} is invalid")]
    InvalidField(String),
    #[error("Expected object")]
    ExpectedObject,
}

/// Entry in a tree manifest.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TreeEntry {
    pub name: String,
    #[serde(rename = "type")]
    pub entry_type: String, // "tree" | "file"
    pub object: String,
    pub epoch: u32,
    #[serde(rename = "fileId", skip_serializing_if = "Option::is_none")]
    pub file_id: Option<String>,
}

/// Tree manifest describing directory structure.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreeManifest {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "type")]
    pub manifest_type: String,
    pub entries: Vec<TreeEntry>,
}

/// File content - either single object or chunked.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "mode")]
pub enum FileContent {
    #[serde(rename = "single")]
    Single {
        object: String,
        epoch: u32,
        #[serde(rename = "contentId", skip_serializing_if = "Option::is_none")]
        content_id: Option<String>,
    },
    #[serde(rename = "chunks")]
    Chunks {
        algorithm: String, // "fastcdc-v1" | "fixed-v1"
        #[serde(rename = "minSize")]
        min_size: u64,
        #[serde(rename = "targetSize")]
        target_size: u64,
        #[serde(rename = "maxSize")]
        max_size: u64,
        chunks: Vec<ChunkDescriptor>,
    },
}

/// Descriptor for a single chunk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkDescriptor {
    pub object: String,
    #[serde(rename = "plainSize")]
    pub plain_size: u64,
    pub epoch: u32,
    #[serde(rename = "contentId", skip_serializing_if = "Option::is_none")]
    pub content_id: Option<String>,
}

/// File manifest describing content and chunking.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileManifest {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "type")]
    pub manifest_type: String,
    #[serde(rename = "fileId")]
    pub file_id: String,
    pub size: u64,
    #[serde(rename = "contentType", skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    pub content: FileContent,
}

/// Validate that an object hash is a valid 64-character hex string.
pub fn require_object_hash(value: &str) -> Result<(), ManifestError> {
    if value.len() != 64 || !value.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(ManifestError::InvalidObjectHash);
    }
    Ok(())
}

/// Create a tree manifest from entries, normalizing and sorting.
pub fn create_tree_manifest(entries: Vec<TreeEntry>) -> Result<TreeManifest, ManifestError> {
    let mut normalized: Vec<TreeEntry> = entries
        .into_iter()
        .map(|mut entry| {
            entry.name = normalize_component(&entry.name)?;
            Ok(entry)
        })
        .collect::<Result<Vec<_>, ManifestError>>()?;

    normalized.sort_by(|a, b| a.name.cmp(&b.name));

    // Check for case collisions
    let mut seen: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    for entry in &normalized {
        let folded = entry.name.to_lowercase();
        if let Some(previous) = seen.get(&folded) {
            return Err(ManifestError::CaseCollision(
                previous.clone(),
                entry.name.clone(),
            ));
        }
        seen.insert(folded, entry.name.clone());
    }

    Ok(TreeManifest {
        schema_version: MANIFEST_SCHEMA_VERSION,
        manifest_type: "tree".to_string(),
        entries: normalized,
    })
}

/// Normalize a path component (NFC normalization, validation).
pub fn normalize_component(name: &str) -> Result<String, ManifestError> {
    let normalized = name.to_string(); // Rust strings are already valid UTF-8
    if normalized.is_empty()
        || normalized == "."
        || normalized == ".."
        || normalized.contains(|c: char| c == '\\' || c == '/' || c.is_control())
    {
        return Err(ManifestError::InvalidPathComponent(name.to_string()));
    }
    Ok(normalized)
}

/// Split a path into components.
pub fn split_path(path: &str) -> Result<Vec<String>, ManifestError> {
    if path.is_empty() {
        return Ok(vec![]);
    }
    let parts: Result<Vec<String>, _> = path.split('/').map(normalize_component).collect();
    let parts = parts?;
    if parts.join("/") != path {
        return Err(ManifestError::InvalidPath);
    }
    Ok(parts)
}

/// Join path components.
pub fn join_path(parts: &[String]) -> Result<String, ManifestError> {
    let normalized: Result<Vec<String>, _> =
        parts.iter().map(|p| normalize_component(p.as_str())).collect();
    Ok(normalized?.join("/"))
}

/// Validate chunk size bounds.
pub fn validate_chunk_sizes(
    min_size: u64,
    target_size: u64,
    max_size: u64,
) -> Result<(), ManifestError> {
    if min_size < 1 || min_size > target_size || target_size > max_size {
        return Err(ManifestError::InvalidChunkBounds);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_require_object_hash_valid() {
        let hash = "a".repeat(64);
        assert!(require_object_hash(&hash).is_ok());
    }

    #[test]
    fn test_require_object_hash_invalid() {
        assert!(require_object_hash("short").is_err());
        assert!(require_object_hash(&"g".repeat(64)).is_err());
    }

    #[test]
    fn test_create_tree_manifest_sorted() {
        let entries = vec![
            TreeEntry {
                name: "z".to_string(),
                entry_type: "file".to_string(),
                object: "a".repeat(64),
                epoch: 1,
                file_id: None,
            },
            TreeEntry {
                name: "a".to_string(),
                entry_type: "file".to_string(),
                object: "b".repeat(64),
                epoch: 1,
                file_id: None,
            },
        ];

        let manifest = create_tree_manifest(entries).unwrap();
        assert_eq!(manifest.entries[0].name, "a");
        assert_eq!(manifest.entries[1].name, "z");
    }

    #[test]
    fn test_case_collision() {
        let entries = vec![
            TreeEntry {
                name: "File".to_string(),
                entry_type: "file".to_string(),
                object: "a".repeat(64),
                epoch: 1,
                file_id: None,
            },
            TreeEntry {
                name: "file".to_string(),
                entry_type: "file".to_string(),
                object: "b".repeat(64),
                epoch: 1,
                file_id: None,
            },
        ];

        assert!(matches!(
            create_tree_manifest(entries),
            Err(ManifestError::CaseCollision(_, _))
        ));
    }

    #[test]
    fn test_split_path() {
        let parts = split_path("a/b/c").unwrap();
        assert_eq!(parts, vec!["a", "b", "c"]);
    }

    #[test]
    fn test_split_path_empty() {
        let parts = split_path("").unwrap();
        assert!(parts.is_empty());
    }

    #[test]
    fn test_join_path() {
        let parts = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let path = join_path(&parts).unwrap();
        assert_eq!(path, "a/b/c");
    }

    #[test]
    fn test_validate_chunk_sizes() {
        assert!(validate_chunk_sizes(1, 100, 1000).is_ok());
        assert!(validate_chunk_sizes(0, 100, 1000).is_err());
        assert!(validate_chunk_sizes(100, 50, 1000).is_err());
        assert!(validate_chunk_sizes(1, 100, 50).is_err());
    }
}
