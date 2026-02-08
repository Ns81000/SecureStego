# Security Architecture

[![GitHub](https://img.shields.io/badge/GitHub-SecureStego-a855f7?style=flat-square&logo=github)](https://github.com/Ns81000/SecureStego) [![Back to README](https://img.shields.io/badge/←_Back_to_README-333?style=flat-square)](../README.md)

## Overview

SecureStego Vault implements a zero-knowledge encryption system where all cryptographic operations occur entirely within the user's browser. This document provides an in-depth technical explanation of the security architecture.

> 📦 **Source Code**: [github.com/Ns81000/SecureStego](https://github.com/Ns81000/SecureStego)

## Threat Model

### Assumptions

1. **Trusted Client**: The user's browser and device are not compromised
2. **HTTPS Transport**: Application is served over HTTPS (or localhost for development)
3. **Web Crypto API**: Browser's native crypto implementation is secure
4. **User Responsibility**: Users protect their PINs and don't share all components together

### Protected Against

✅ Server-side data breaches (no server exists)  
✅ Man-in-the-middle attacks (HTTPS only)  
✅ Brute force attacks (PBKDF2 with high iteration count)  
✅ Data tampering (HMAC integrity verification)  
✅ Weak random numbers (crypto.getRandomValues)  

### NOT Protected Against

❌ Malicious browser extensions  
❌ Keyloggers or screen capture malware  
❌ Physical access to unlocked device  
❌ User sharing all three components insecurely  
❌ Weak PIN choices (though we warn users)  

## Cryptographic Implementation

### 1. Key Derivation (PBKDF2)

**Purpose**: Convert user's 6-digit PIN into a strong 256-bit encryption key

```javascript
Key = PBKDF2(
    password: PIN,           // 6-digit numeric string
    salt: random(16 bytes),  // Cryptographically random
    iterations: 100,000,      // OWASP recommended minimum
    hash: SHA-256,           // Strong hash function
    keyLength: 256 bits      // AES-256 key size
)
```

**Security Properties**:
- **Salt**: Prevents rainbow table attacks
- **High Iteration Count**: Makes brute force computationally expensive
- **SHA-256**: Collision-resistant hash function
- **Unique Per File**: Each encryption uses a new random salt

**Attack Resistance**:
- Testing one PIN takes ~0.1 seconds (100,000 iterations)
- Full PIN space (000000-999999) = 1,000,000 possibilities
- Brute force time: ~100,000 seconds (~27 hours) per salt
- With unique salts, each file requires separate brute force

### 2. Encryption (AES-256-GCM)

**Purpose**: Encrypt file data with authenticated encryption

```javascript
Ciphertext = AES-256-GCM.Encrypt(
    key: DerivedKey,           // From PBKDF2
    plaintext: FileData,       // Original file bytes
    iv: random(12 bytes),      // Unique initialization vector
    additionalData: null,      // No AAD in this implementation
    tagLength: 128 bits        // Authentication tag
)
```

**Security Properties**:
- **AES-256**: Industry standard symmetric encryption
- **GCM Mode**: Provides both confidentiality and authenticity
- **Authentication Tag**: Detects any modification to ciphertext
- **Unique IV**: Each encryption uses random IV (prevents IV reuse attacks)

**Why GCM Over CBC/CTR?**
- ✅ Built-in authentication (no need for separate HMAC)
- ✅ Parallel processing (faster for large files)
- ✅ Protection against padding oracle attacks
- ✅ Single-pass authenticated encryption

### 3. Integrity Verification (HMAC-SHA256)

**Purpose**: Verify encrypted data hasn't been tampered with

```javascript
HMAC = HMAC-SHA256(
    key: DerivedKey,           // Same as encryption key
    message: Ciphertext        // Encrypted data
)
```

**Security Properties**:
- **Double Protection**: GCM tag + HMAC ensures integrity
- **Keyed Hash**: Only someone with the key can compute valid HMAC
- **SHA-256**: 256-bit output, collision-resistant

**Why Additional HMAC?**
- Defense in depth: Catches corruption before decryption attempt
- Early detection of wrong PIN or corrupted image
- Validates extracted steganography data integrity

### 4. Steganography (LSB Encoding)

**Purpose**: Hide encryption metadata invisibly within an image

#### Data Structure

```text
Embedded Data Layout (96 bytes total):
┌────────────────┬─────────┬──────┐
│ Bytes 0-3      │ 4       │ Data │
├────────────────┼─────────┼──────┤
│ Data Length    │ 4 bytes │ uint32 big-endian │
│ Salt           │ 16 bytes│ Random salt │
│ IV             │ 12 bytes│ Random initialization vector │
│ Key            │ 32 bytes│ Derived encryption key │
│ HMAC           │ 32 bytes│ HMAC-SHA256 of ciphertext │
└────────────────┴─────────┴──────┘
Total: 4 + 16 + 12 + 32 + 32 = 96 bytes
```

#### LSB Algorithm

```text
For each byte of data:
    For each bit in byte (MSB to LSB):
        Take next pixel's RGB channel
        Clear LSB: channel = channel & 0xFE
        Set LSB to data bit: channel = channel | bit
        Store modified channel

Result: Each byte requires ~3 pixels (8 bits ÷ 3 channels ≈ 2.67 pixels)
```

**Security Properties**:
- **Invisible**: LSB changes are imperceptible to human eye
- **Lossless Required**: Must use PNG (JPEG compression destroys LSB data)
- **Capacity**: 1200x1200 image can store: (1200 × 1200 × 3) ÷ 8 = 540,000 bytes
- **Our Usage**: Only 96 bytes embedded (0.018% of capacity)

**Steganography Limitations**:
- ⚠️ Security through obscurity: Determined attacker can extract data
- ⚠️ Still requires PIN: Extracted key material is useless without correct PIN
- ⚠️ Image modification: Any PNG re-encoding may destroy hidden data

### 5. Random Number Generation

All random values use `crypto.getRandomValues()`:

```javascript
const salt = new Uint8Array(16);
crypto.getRandomValues(salt);  // CSPRNG
```

**Why This Matters**:
- `Math.random()` is NOT cryptographically secure
- `crypto.getRandomValues()` uses OS-level entropy source
- Meets cryptographic standards for unpredictability

## Implementation Details

### Memory Safety

```javascript
// After use, clear sensitive data
function clearSensitiveData(data) {
    if (data instanceof Uint8Array) {
        data.fill(0);  // Overwrite with zeros
    }
}
```

**Note**: JavaScript doesn't guarantee memory won't be swapped to disk or stay in memory. This is best-effort.

### Timing Attack Prevention

Web Crypto API implementations use constant-time operations internally. PIN comparison should ideally be constant-time, but:

```javascript
// BAD: Early exit on mismatch
if (pin !== storedPin) return false;

// BETTER: Compare all characters
let match = pin.length === storedPin.length;
for (let i = 0; i < pin.length; i++) {
    match = match && (pin[i] === storedPin[i]);
}
return match;
```

Our implementation relies on Web Crypto's constant-time key derivation rather than direct PIN comparison.

### Error Handling

```javascript
try {
    const decrypted = await decrypt(ciphertext, key, iv);
} catch (error) {
    // Don't reveal whether PIN was wrong vs. data corrupted
    throw new Error('Decryption failed - incorrect PIN or corrupted data');
}
```

**Generic Error Messages**: Prevents attackers from distinguishing failure causes.

## File Format Specification

### Encrypted File

```text
Format: Raw binary (application/octet-stream)
Extension: .encrypted (suggested)
Content: Direct AES-256-GCM output (ciphertext + auth tag)
```

**No Header**: Pure encrypted bytes. Original filename stored separately.

### Key Image

```text
Format: PNG (lossless compression)
Dimensions: 1200x1200 pixels
Color Depth: 24-bit RGB
Content: Procedurally generated abstract art + LSB-embedded metadata
```

**Why PNG?**
- ✅ Lossless: Preserves LSB data perfectly
- ✅ Standard: Universal browser support
- ✅ Compression: Reduces file size without quality loss
- ❌ JPEG: Lossy compression destroys LSB data
- ❌ WebP: Lossy modes also destroy LSB data

## Attack Scenarios

### 1. Brute Force Attack on PIN

**Scenario**: Attacker has encrypted file + key image, tries all PINs

```text
Total PINs: 1,000,000 (000000 to 999999)
Time per attempt: ~0.1 seconds (100,000 PBKDF2 iterations)
Total time: ~27 hours for single-threaded attack
```

**Defenses**:
- High PBKDF2 iteration count slows attempts
- Unique salt per file means no pre-computation
- User warned to choose strong, random PINs

**Recommendations**:
- Avoid sequential (123456) or repeated (111111) PINs
- Use random 6-digit codes
- Change PIN for different files

### 2. Image Steganography Detection

**Scenario**: Attacker analyzes image to detect hidden data

**Detection Methods**:
- LSB analysis: Statistical tests on least significant bits
- Visual analysis: No visible artifacts (LSB changes ≈1 brightness unit)
- File size: Image size normal for 1200x1200 PNG

**Defenses**:
- Data is encrypted before embedding (appears random)
- Low embedding rate (only 96 bytes in 540KB capacity)
- Abstract art patterns mask statistical anomalies

### 3. Man-in-the-Middle Attack

**Scenario**: Attacker intercepts application during delivery

**Defenses**:
- ✅ HTTPS only (enforced in meta tags)
- ✅ Content Security Policy prevents script injection
- ✅ Subresource Integrity (optional, for future CDN assets)

**User Verification**:
- Check URL: `https://` prefix
- Verify domain matches expected site
- Look for valid SSL certificate

### 4. Compromised Browser Extension

**Scenario**: Malicious extension logs keystrokes or modifies page

**Defenses**: 
- ⚠️ Limited - extensions have significant access
- Use browser profiles without untrusted extensions
- Review extension permissions before installing

### 5. File Corruption

**Scenario**: Encrypted file or image is partially corrupted

**Defenses**:
- ✅ HMAC verification detects corruption before decryption
- ✅ GCM authentication tag validates ciphertext integrity
- ✅ LSB extraction validates header format

**Error Messages**:
- "HMAC verification failed - data may be corrupted"
- "Invalid data length - image may not contain valid encryption data"

## Compliance & Standards

### Cryptographic Standards

- **AES-256**: FIPS 197, NIST approved
- **PBKDF2**: RFC 2898, NIST SP 800-132
- **HMAC-SHA256**: RFC 2104, FIPS 198-1
- **GCM**: NIST SP 800-38D

### Best Practices Followed

✅ **OWASP**: High PBKDF2 iterations, secure random generation  
✅ **NIST**: Approved algorithms and key sizes  
✅ **Mozilla**: Web Crypto API best practices  
✅ **Google**: Client-side encryption guidelines  

## Security Audit Recommendations

Before deploying for sensitive data:

1. **Code Review**: Independent security expert review
2. **Penetration Testing**: Attempt to break encryption
3. **Formal Verification**: Prove cryptographic correctness
4. **Third-Party Audit**: Professional security firm assessment

## Frequently Asked Questions

### Is this quantum-resistant?

**No.** AES-256 has ~128-bit security against quantum attacks (Grover's algorithm). For quantum resistance, consider:
- Post-quantum algorithms (e.g., CRYSTALS-Kyber)
- Longer symmetric keys (512-bit)

### Can I trust the Web Crypto API?

**Generally yes.** Browser vendors implement Web Crypto following standards. However:
- Browser bugs are possible
- Implementation quality varies
- For maximum paranoia, use desktop encryption tools

### What if I forget my PIN?

**Unrecoverable.** There is no "forgot PIN" option. The encryption is designed to be unbreakable without the correct PIN. This is intentional for security.

### Can government agencies decrypt this?

**Unlikely without your PIN.** AES-256 with proper implementation is considered secure even against nation-state actors. However:
- Rubber-hose cryptanalysis (forcing you to reveal PIN) works
- Browser vulnerabilities could potentially be exploited
- Side-channel attacks on specific devices are theoretically possible

## Conclusion

SecureStego Vault provides strong, client-side encryption suitable for protecting moderately sensitive files. While not suitable for nation-state-level secrets, it offers practical security for:

✅ Personal documents  
✅ Financial records  
✅ Private photos/videos  
✅ Business confidential files  

Always follow security best practices:
- Use strong, random PINs
- Share components through separate channels
- Keep software and browsers updated
- Don't reuse PINs across files

---

**Last Updated**: February 2026
**Security Version**: 1.0
**Repository**: [github.com/Ns81000/SecureStego](https://github.com/Ns81000/SecureStego)
**Report Security Issues**: [GitHub Security](https://github.com/Ns81000/SecureStego/security)
