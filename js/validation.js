/**
 * validation.js - Input Validation
 * Handles PIN validation, file checks, and form validation
 */

'use strict';

/**
 * Validates a 6-digit PIN
 * @param {string} pin - PIN to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validatePIN(pin) {
    if (!pin) {
        return { valid: false, error: 'PIN is required' };
    }

    if (typeof pin !== 'string') {
        return { valid: false, error: 'PIN must be a string' };
    }

    if (pin.length !== 6) {
        return { valid: false, error: 'PIN must be exactly 6 digits' };
    }

    if (!/^\d{6}$/.test(pin)) {
        return { valid: false, error: 'PIN must contain only numbers' };
    }

    // Check for weak PINs (optional)
    const weakPatterns = [
        '000000', '111111', '222222', '333333', '444444',
        '555555', '666666', '777777', '888888', '999999',
        '123456', '654321', '012345', '543210',
        '111222', '222333', '333444'
    ];

    if (weakPatterns.includes(pin)) {
        return { 
            valid: true, // Still valid, but warn
            warning: 'This PIN is weak. Consider using a more random combination.'
        };
    }

    return { valid: true };
}

/**
 * Checks if a PIN has enough entropy (randomness)
 * @param {string} pin - PIN to check
 * @returns {Object} {entropy: number, strength: string}
 */
export function checkPINStrength(pin) {
    if (!pin || pin.length !== 6) {
        return { entropy: 0, strength: 'invalid' };
    }

    // Count unique digits
    const uniqueDigits = new Set(pin.split('')).size;
    
    // Check for sequential patterns
    let sequential = 0;
    for (let i = 0; i < pin.length - 1; i++) {
        const diff = Math.abs(parseInt(pin[i]) - parseInt(pin[i + 1]));
        if (diff <= 1) sequential++;
    }

    // Calculate entropy score (0-100)
    let entropy = 0;
    entropy += (uniqueDigits / 6) * 40; // Unique digits contribution
    entropy += ((6 - sequential) / 6) * 40; // Non-sequential contribution
    entropy += 20; // Base entropy for being 6 digits

    // Determine strength
    let strength;
    if (entropy < 40) {
        strength = 'weak';
    } else if (entropy < 70) {
        strength = 'medium';
    } else {
        strength = 'strong';
    }

    return { entropy: Math.round(entropy), strength };
}

/**
 * Validates file for encryption
 * @param {File} file - File to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateEncryptionFile(file) {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (file.size === 0) {
        return { valid: false, error: 'File is empty' };
    }

    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
        return { 
            valid: false, 
            error: `File is too large. Maximum size is 1GB (${(maxSize / (1024 * 1024 * 1024)).toFixed(1)}GB)` 
        };
    }

    return { valid: true };
}

/**
 * Validates encrypted file for decryption
 * @param {File} file - Encrypted file to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateEncryptedFile(file) {
    if (!file) {
        return { valid: false, error: 'No encrypted file selected' };
    }

    if (file.size === 0) {
        return { valid: false, error: 'Encrypted file is empty' };
    }

    // Check if file might be encrypted (basic heuristic)
    if (!file.name.endsWith('.encrypted') && !file.type) {
        return {
            valid: true,
            warning: 'File does not have .encrypted extension. Make sure this is the correct encrypted file.'
        };
    }

    return { valid: true };
}

/**
 * Validates key image file
 * @param {File} file - Image file to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateKeyImage(file) {
    if (!file) {
        return { valid: false, error: 'No key image selected' };
    }

    if (file.size === 0) {
        return { valid: false, error: 'Key image is empty' };
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Selected file is not an image' };
    }

    // Prefer PNG (lossless)
    if (file.type !== 'image/png') {
        return {
            valid: false,
            error: 'Key image must be PNG format. JPEG and other formats will not work.'
        };
    }

    // Check dimensions (will be validated further after loading)
    const minSize = 1200 * 1200 * 4; // Rough estimate for 1200x1200 image
    if (file.size < minSize / 10) {
        return {
            valid: true,
            warning: 'Image seems small. Make sure this is the correct key image.'
        };
    }

    return { valid: true };
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }

    // Create a temporary div to use browser's HTML parser
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Validates filename
 * @param {string} filename - Filename to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateFilename(filename) {
    if (!filename) {
        return { valid: false, error: 'Filename is empty' };
    }

    if (filename.length > 255) {
        return { valid: false, error: 'Filename is too long (max 255 characters)' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(filename)) {
        return { 
            valid: false, 
            error: 'Filename contains invalid characters: < > : " / \\ | ? *' 
        };
    }

    return { valid: true };
}

/**
 * Checks if browser is supported
 * @returns {Object} {supported: boolean, missing: Array}
 */
export function checkBrowserSupport() {
    const features = {
        'Web Crypto API': typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
        'File API': typeof File !== 'undefined' && typeof FileReader !== 'undefined',
        'Canvas API': typeof HTMLCanvasElement !== 'undefined',
        'Blob API': typeof Blob !== 'undefined',
        'URL API': typeof URL !== 'undefined',
        'ES6 Support': typeof Promise !== 'undefined' && typeof Symbol !== 'undefined'
    };

    const missing = Object.keys(features).filter(key => !features[key]);
    const supported = missing.length === 0;

    return { supported, missing, features };
}

/**
 * Validates decryption inputs (all three components)
 * @param {File} encryptedFile - Encrypted file
 * @param {File} keyImage - Key image
 * @param {string} pin - PIN
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateDecryptionInputs(encryptedFile, keyImage, pin) {
    const errors = [];

    const fileValidation = validateEncryptedFile(encryptedFile);
    if (!fileValidation.valid) {
        errors.push(fileValidation.error);
    }

    const imageValidation = validateKeyImage(keyImage);
    if (!imageValidation.valid) {
        errors.push(imageValidation.error);
    }

    const pinValidation = validatePIN(pin);
    if (!pinValidation.valid) {
        errors.push(pinValidation.error);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validates encryption inputs
 * @param {File} file - File to encrypt
 * @param {string} pin - PIN
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateEncryptionInputs(file, pin) {
    const errors = [];

    const fileValidation = validateEncryptionFile(file);
    if (!fileValidation.valid) {
        errors.push(fileValidation.error);
    }

    const pinValidation = validatePIN(pin);
    if (!pinValidation.valid) {
        errors.push(pinValidation.error);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Generates a random secure PIN
 * @returns {string} Random 6-digit PIN
 */
export function generateRandomPIN() {
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    
    // Convert to digits 0-9
    return Array.from(array)
        .map(n => n % 10)
        .join('');
}

/**
 * Formats validation errors for display
 * @param {Array} errors - Array of error messages
 * @returns {string} Formatted error message
 */
export function formatValidationErrors(errors) {
    if (!errors || errors.length === 0) {
        return '';
    }

    if (errors.length === 1) {
        return errors[0];
    }

    return 'Multiple errors:\n' + errors.map((err, i) => `${i + 1}. ${err}`).join('\n');
}

/**
 * Checks if a file extension is in a list of allowed extensions
 * @param {string} filename - Filename to check
 * @param {Array} allowedExtensions - Array of allowed extensions (e.g., ['.png', '.jpg'])
 * @returns {boolean} True if extension is allowed
 */
export function isExtensionAllowed(filename, allowedExtensions) {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.some(ext => ext.toLowerCase() === extension);
}

/**
 * Validates if an object is a valid File object
 * @param {any} obj - Object to check
 * @returns {boolean} True if valid File
 */
export function isValidFile(obj) {
    return obj instanceof File ||
           (obj instanceof Blob && obj.name !== undefined);
}

/**
 * Gets a user-friendly error message for common errors
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 */
export function getUserFriendlyError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your connection.';
    }
    if (message.includes('memory') || message.includes('allocation')) {
        return 'Not enough memory. Try closing other tabs or use a smaller file.';
    }
    if (message.includes('permission') || message.includes('denied')) {
        return 'Permission denied. Please check browser settings.';
    }
    if (message.includes('corrupt') || message.includes('invalid')) {
        return 'File appears to be corrupted or invalid.';
    }
    if (message.includes('timeout')) {
        return 'Operation timed out. Please try again.';
    }

    return error.message || 'An unknown error occurred';
}
