//! Cryptographic primitives for Lapis Sync.
//!
//! Implements HKDF-SHA256 key derivation and XChaCha20-Poly1305 authenticated encryption.
//! Private keys never enter this module; all operations use host-provided key material.

use chacha20poly1305::{
    aead::{Aead, KeyInit},
    XChaCha20Poly1305, XNonce,
};
use hkdf::Hkdf;
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Invalid key length")]
    InvalidKeyLength,
    #[error("Invalid nonce length")]
    InvalidNonceLength,
    #[error("Encryption failed")]
    EncryptionFailed,
    #[error("Decryption failed")]
    DecryptionFailed,
    #[error("HMAC verification failed")]
    HmacVerificationFailed,
    #[error("HKDF expansion failed")]
    HkdfExpansionFailed,
}

type HmacSha256 = Hmac<Sha256>;

/// Derive a purpose-specific key using HKDF-SHA256.
///
/// # Arguments
/// * `ikm` - Input key material
/// * `salt` - Optional salt (recommended for domain separation)
/// * `info` - Context and application-specific information
///
/// # Returns
/// 32-byte derived key
pub fn hkdf_sha256(ikm: &[u8], salt: Option<&[u8]>, info: &[u8]) -> Result<[u8; 32], CryptoError> {
    let hk = Hkdf::<Sha256>::new(salt, ikm);
    let mut okm = [0u8; 32];
    hk.expand(info, &mut okm)
        .map_err(|_| CryptoError::HkdfExpansionFailed)?;
    Ok(okm)
}

/// Compute HMAC-SHA256.
pub fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<[u8; 32], CryptoError> {
    let mut mac = <HmacSha256 as Mac>::new_from_slice(key)
        .map_err(|_| CryptoError::InvalidKeyLength)?;
    mac.update(data);
    let result = mac.finalize();
    Ok(result.into_bytes().into())
}

/// Verify HMAC-SHA256.
pub fn hmac_sha256_verify(key: &[u8], data: &[u8], expected: &[u8; 32]) -> Result<bool, CryptoError> {
    let computed = hmac_sha256(key, data)?;
    Ok(computed == *expected)
}

/// Compute SHA-256 hash.
pub fn sha256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// XChaCha20-Poly1305 nonce size (24 bytes).
pub const XCHACHA20_NONCE_SIZE: usize = 24;

/// Encrypt data using XChaCha20-Poly1305.
///
/// # Arguments
/// * `key` - 32-byte encryption key
/// * `nonce` - 24-byte nonce (must be unique per key)
/// * `plaintext` - Data to encrypt
/// * `aad` - Optional additional authenticated data
///
/// # Returns
/// Ciphertext with appended 16-byte authentication tag
pub fn xchacha20poly1305_encrypt(
    key: &[u8; 32],
    nonce: &[u8; XCHACHA20_NONCE_SIZE],
    plaintext: &[u8],
    aad: Option<&[u8]>,
) -> Result<Vec<u8>, CryptoError> {
    let cipher = XChaCha20Poly1305::new(key.into());
    let nonce = XNonce::from_slice(nonce);

    let ciphertext = if let Some(aad) = aad {
        use chacha20poly1305::aead::Payload;
        cipher
            .encrypt(nonce, Payload { msg: plaintext, aad })
            .map_err(|_| CryptoError::EncryptionFailed)?
    } else {
        cipher
            .encrypt(nonce, plaintext)
            .map_err(|_| CryptoError::EncryptionFailed)?
    };

    Ok(ciphertext)
}

/// Decrypt data using XChaCha20-Poly1305.
///
/// # Arguments
/// * `key` - 32-byte encryption key
/// * `nonce` - 24-byte nonce
/// * `ciphertext` - Ciphertext with appended authentication tag
/// * `aad` - Optional additional authenticated data (must match encryption)
///
/// # Returns
/// Decrypted plaintext
pub fn xchacha20poly1305_decrypt(
    key: &[u8; 32],
    nonce: &[u8; XCHACHA20_NONCE_SIZE],
    ciphertext: &[u8],
    aad: Option<&[u8]>,
) -> Result<Vec<u8>, CryptoError> {
    let cipher = XChaCha20Poly1305::new(key.into());
    let nonce = XNonce::from_slice(nonce);

    let plaintext = if let Some(aad) = aad {
        use chacha20poly1305::aead::Payload;
        cipher
            .decrypt(nonce, Payload { msg: ciphertext, aad })
            .map_err(|_| CryptoError::DecryptionFailed)?
    } else {
        cipher
            .decrypt(nonce, ciphertext)
            .map_err(|_| CryptoError::DecryptionFailed)?
    };

    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hkdf_sha256() {
        let ikm = b"input key material";
        let salt = b"salt";
        let info = b"info";

        let key1 = hkdf_sha256(ikm, Some(salt), info).unwrap();
        let key2 = hkdf_sha256(ikm, Some(salt), info).unwrap();
        assert_eq!(key1, key2);

        let key3 = hkdf_sha256(ikm, Some(salt), b"different info").unwrap();
        assert_ne!(key1, key3);
    }

    #[test]
    fn test_hmac_sha256() {
        let key = b"secret key";
        let data = b"message";

        let mac1 = hmac_sha256(key, data).unwrap();
        let mac2 = hmac_sha256(key, data).unwrap();
        assert_eq!(mac1, mac2);

        assert!(hmac_sha256_verify(key, data, &mac1).unwrap());
        assert!(!hmac_sha256_verify(key, b"different", &mac1).unwrap());
    }

    #[test]
    fn test_sha256() {
        let hash1 = sha256(b"hello");
        let hash2 = sha256(b"hello");
        assert_eq!(hash1, hash2);

        let hash3 = sha256(b"world");
        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_xchacha20poly1305_roundtrip() {
        let key = [0x42u8; 32];
        let nonce = [0x01u8; XCHACHA20_NONCE_SIZE];
        let plaintext = b"secret message";

        let ciphertext = xchacha20poly1305_encrypt(&key, &nonce, plaintext, None).unwrap();
        let decrypted = xchacha20poly1305_decrypt(&key, &nonce, &ciphertext, None).unwrap();

        assert_eq!(&decrypted, plaintext);
    }

    #[test]
    fn test_xchacha20poly1305_with_aad() {
        let key = [0x42u8; 32];
        let nonce = [0x01u8; XCHACHA20_NONCE_SIZE];
        let plaintext = b"secret message";
        let aad = b"additional data";

        let ciphertext = xchacha20poly1305_encrypt(&key, &nonce, plaintext, Some(aad)).unwrap();
        let decrypted = xchacha20poly1305_decrypt(&key, &nonce, &ciphertext, Some(aad)).unwrap();

        assert_eq!(&decrypted, plaintext);

        // Decryption should fail with wrong AAD
        let result = xchacha20poly1305_decrypt(&key, &nonce, &ciphertext, Some(b"wrong aad"));
        assert!(result.is_err());
    }

    #[test]
    fn test_xchacha20poly1305_authentication() {
        let key = [0x42u8; 32];
        let nonce = [0x01u8; XCHACHA20_NONCE_SIZE];
        let plaintext = b"secret message";

        let mut ciphertext = xchacha20poly1305_encrypt(&key, &nonce, plaintext, None).unwrap();

        // Tamper with ciphertext
        if let Some(byte) = ciphertext.get_mut(0) {
            *byte ^= 0xFF;
        }

        let result = xchacha20poly1305_decrypt(&key, &nonce, &ciphertext, None);
        assert!(result.is_err());
    }
}
