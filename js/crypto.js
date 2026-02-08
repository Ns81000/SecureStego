/**
 * crypto.js - Cryptographic operations using Web Crypto API
 * Handles AES-256-GCM encryption/decryption with PBKDF2 key derivation
 */

'use strict';

// Constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for GCM mode
const KEY_LENGTH = 256; // bits

/**
 * Generates cryptographically secure random bytes
 * @param {number} length - Number of bytes to generate
 * @returns {Uint8Array} Random bytes
 */
export function generateRandomBytes(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

/**
 * Derives an encryption key from a PIN and salt using PBKDF2
 * @param {string} pin - 6-digit PIN code
 * @param {Uint8Array} salt - Random salt
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
export async function deriveKeyFromPIN(pin, salt) {
    try {
        // Convert PIN to ArrayBuffer
        const encoder = new TextEncoder();
        const pinBuffer = encoder.encode(pin);

        // Import PIN as base key
        const baseKey = await crypto.subtle.importKey(
            'raw',
            pinBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive encryption key using PBKDF2
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: KEY_LENGTH },
            true, // extractable for embedding in image
            ['encrypt', 'decrypt']
        );

        return derivedKey;
    } catch (error) {
        console.error('Key derivation error:', error);
        throw new Error('Failed to derive encryption key from PIN');
    }
}

/**
 * Exports a CryptoKey to raw bytes
 * @param {CryptoKey} key - Key to export
 * @returns {Promise<Uint8Array>} Raw key bytes
 */
export async function exportKey(key) {
    try {
        const exported = await crypto.subtle.exportKey('raw', key);
        return new Uint8Array(exported);
    } catch (error) {
        console.error('Key export error:', error);
        throw new Error('Failed to export key');
    }
}

/**
 * Imports raw key bytes as a CryptoKey
 * @param {Uint8Array} keyBytes - Raw key bytes
 * @returns {Promise<CryptoKey>} Imported key
 */
export async function importKey(keyBytes) {
    try {
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM', length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
        return key;
    } catch (error) {
        console.error('Key import error:', error);
        throw new Error('Failed to import key');
    }
}

/**
 * Encrypts data using AES-256-GCM
 * @param {ArrayBuffer} data - Data to encrypt
 * @param {CryptoKey} key - Encryption key
 * @param {Uint8Array} iv - Initialization vector
 * @returns {Promise<ArrayBuffer>} Encrypted data
 */
export async function encryptData(data, key, iv) {
    try {
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128 // 16 bytes authentication tag
            },
            key,
            data
        );
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts data using AES-256-GCM
 * @param {ArrayBuffer} encryptedData - Data to decrypt
 * @param {CryptoKey} key - Decryption key
 * @param {Uint8Array} iv - Initialization vector
 * @returns {Promise<ArrayBuffer>} Decrypted data
 */
export async function decryptData(encryptedData, key, iv) {
    try {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128
            },
            key,
            encryptedData
        );
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed - incorrect PIN or corrupted data');
    }
}

/**
 * Computes HMAC-SHA256 for data integrity verification
 * @param {ArrayBuffer} data - Data to hash
 * @param {CryptoKey} key - HMAC key
 * @returns {Promise<ArrayBuffer>} HMAC hash
 */
export async function computeHMAC(data, key) {
    try {
        // Import key for HMAC
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        const hmacKey = await crypto.subtle.importKey(
            'raw',
            exportedKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        // Compute HMAC
        const signature = await crypto.subtle.sign(
            'HMAC',
            hmacKey,
            data
        );

        return signature;
    } catch (error) {
        console.error('HMAC computation error:', error);
        throw new Error('Failed to compute HMAC');
    }
}

/**
 * Verifies HMAC-SHA256 signature
 * @param {ArrayBuffer} data - Data to verify
 * @param {ArrayBuffer} signature - HMAC signature
 * @param {CryptoKey} key - HMAC key
 * @returns {Promise<boolean>} True if signature is valid
 */
export async function verifyHMAC(data, signature, key) {
    try {
        // Import key for HMAC
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        const hmacKey = await crypto.subtle.importKey(
            'raw',
            exportedKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        // Verify HMAC
        const isValid = await crypto.subtle.verify(
            'HMAC',
            hmacKey,
            signature,
            data
        );

        return isValid;
    } catch (error) {
        console.error('HMAC verification error:', error);
        return false;
    }
}

/**
 * Encrypts a file with progress callback
 * @param {File} file - File to encrypt
 * @param {string} pin - 6-digit PIN
 * @param {Function} progressCallback - Called with progress percentage
 * @returns {Promise<{encrypted: Blob, salt: Uint8Array, iv: Uint8Array, key: CryptoKey, hmac: Uint8Array}>}
 */
export async function encryptFile(file, pin, progressCallback = null) {
    try {
        // Generate salt and IV
        const salt = generateRandomBytes(SALT_LENGTH);
        const iv = generateRandomBytes(IV_LENGTH);

        // Derive key from PIN
        progressCallback?.(5);
        const key = await deriveKeyFromPIN(pin, salt);
        progressCallback?.(10);

        // Read file data
        const fileData = await file.arrayBuffer();
        progressCallback?.(30);

        // Encrypt data
        const encryptedData = await encryptData(fileData, key, iv);
        progressCallback?.(80);

        // Compute HMAC for integrity
        const hmac = await computeHMAC(encryptedData, key);
        progressCallback?.(90);

        // Create blob
        const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
        progressCallback?.(100);

        return {
            encrypted: encryptedBlob,
            salt: salt,
            iv: iv,
            key: key,
            hmac: new Uint8Array(hmac)
        };
    } catch (error) {
        console.error('File encryption error:', error);
        throw new Error('Failed to encrypt file: ' + error.message);
    }
}

/**
 * Decrypts a file with progress callback
 * @param {Blob} encryptedBlob - Encrypted file
 * @param {string} pin - 6-digit PIN
 * @param {Uint8Array} salt - Salt used for encryption
 * @param {Uint8Array} iv - IV used for encryption
 * @param {Uint8Array} expectedHMAC - HMAC for integrity verification
 * @param {Function} progressCallback - Called with progress percentage
 * @returns {Promise<Blob>} Decrypted file
 */
export async function decryptFile(encryptedBlob, pin, salt, iv, expectedHMAC, progressCallback = null) {
    try {
        // Derive key from PIN
        progressCallback?.(5);
        const key = await deriveKeyFromPIN(pin, salt);
        progressCallback?.(15);

        // Read encrypted data
        const encryptedData = await encryptedBlob.arrayBuffer();
        progressCallback?.(30);

        // Verify HMAC
        const isValid = await verifyHMAC(encryptedData, expectedHMAC, key);
        if (!isValid) {
            throw new Error('HMAC verification failed - data may be corrupted');
        }
        progressCallback?.(50);

        // Decrypt data
        const decryptedData = await decryptData(encryptedData, key, iv);
        progressCallback?.(90);

        // Create blob
        const decryptedBlob = new Blob([decryptedData]);
        progressCallback?.(100);

        return decryptedBlob;
    } catch (error) {
        console.error('File decryption error:', error);
        throw new Error('Failed to decrypt file: ' + error.message);
    }
}

/**
 * Clears sensitive data from memory (best effort)
 * @param {Uint8Array|ArrayBuffer} data - Data to clear
 */
export function clearSensitiveData(data) {
    try {
        if (data instanceof Uint8Array) {
            data.fill(0);
        } else if (data instanceof ArrayBuffer) {
            new Uint8Array(data).fill(0);
        }
    } catch (error) {
        // Best effort - some environments may not allow this
        console.warn('Could not clear sensitive data:', error);
    }
}

/**
 * Checks if Web Crypto API is available and properly configured
 * @returns {boolean} True if crypto is available
 */
export function isCryptoAvailable() {
    return typeof crypto !== 'undefined' &&
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues === 'function';
}

/**
 * Gets a human-readable error message for crypto errors
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function getCryptoErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('secure context')) {
        return 'This app requires HTTPS. Please access via https:// or localhost';
    }
    if (message.includes('not supported')) {
        return 'Your browser does not support the required encryption features';
    }
    if (message.includes('decrypt')) {
        return 'Decryption failed - incorrect PIN or corrupted files';
    }
    if (message.includes('hmac')) {
        return 'File integrity check failed - the file may have been tampered with';
    }
    
    return 'An encryption error occurred. Please try again.';
}
