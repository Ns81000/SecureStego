/**
 * steganography.js - LSB (Least Significant Bit) Steganography
 * Embeds and extracts encryption metadata from images
 */

'use strict';

// Constants
const HEADER_SIZE = 4; // 4 bytes for data length
const SALT_SIZE = 16; // bytes
const IV_SIZE = 12; // bytes
const HMAC_SIZE = 32; // bytes (SHA-256)
const KEY_SIZE = 32; // bytes (256 bits)

/**
 * Converts a number to a 4-byte array
 * @param {number} num - Number to convert
 * @returns {Uint8Array} 4-byte array
 */
function numberToBytes(num) {
    const bytes = new Uint8Array(4);
    bytes[0] = (num >> 24) & 0xFF;
    bytes[1] = (num >> 16) & 0xFF;
    bytes[2] = (num >> 8) & 0xFF;
    bytes[3] = num & 0xFF;
    return bytes;
}

/**
 * Converts a 4-byte array to a number
 * @param {Uint8Array} bytes - 4-byte array
 * @returns {number} Converted number
 */
function bytesToNumber(bytes) {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
}

/**
 * Embeds data into an image using LSB steganography
 * @param {HTMLCanvasElement} canvas - Canvas with the image
 * @param {Uint8Array} salt - Encryption salt
 * @param {Uint8Array} iv - Encryption IV
 * @param {Uint8Array} hmac - HMAC signature
 * @param {Uint8Array} keyBytes - Encryption key bytes
 * @returns {HTMLCanvasElement} Canvas with embedded data
 */
export function embedDataInImage(canvas, salt, iv, hmac, keyBytes) {
    try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Prepare data to embed: [length][salt][iv][key][hmac]
        const totalDataSize = SALT_SIZE + IV_SIZE + KEY_SIZE + HMAC_SIZE;
        const dataToEmbed = new Uint8Array(HEADER_SIZE + totalDataSize);
        
        // Write header (data length)
        dataToEmbed.set(numberToBytes(totalDataSize), 0);
        
        // Write data
        let offset = HEADER_SIZE;
        dataToEmbed.set(salt, offset);
        offset += SALT_SIZE;
        dataToEmbed.set(iv, offset);
        offset += IV_SIZE;
        dataToEmbed.set(keyBytes, offset);
        offset += KEY_SIZE;
        dataToEmbed.set(hmac, offset);

        // Check if image has enough capacity
        const requiredPixels = dataToEmbed.length * 8 / 3; // 3 color channels per pixel
        const availablePixels = pixels.length / 4; // 4 values per pixel (RGBA)
        
        if (requiredPixels > availablePixels) {
            throw new Error('Image is too small to embed the encryption data');
        }

        // Embed data in LSB of RGB channels (skip alpha)
        let dataIndex = 0;
        let bitIndex = 0;
        
        for (let i = 0; i < pixels.length && dataIndex < dataToEmbed.length; i += 4) {
            // Process R, G, B channels (skip A at i+3)
            for (let channel = 0; channel < 3 && dataIndex < dataToEmbed.length; channel++) {
                const pixelIndex = i + channel;
                
                // Get the bit to embed
                const dataByte = dataToEmbed[dataIndex];
                const bit = (dataByte >> (7 - bitIndex)) & 1;
                
                // Clear LSB and set new bit
                pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | bit;
                
                // Move to next bit
                bitIndex++;
                if (bitIndex === 8) {
                    bitIndex = 0;
                    dataIndex++;
                }
            }
        }

        // Write modified pixel data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        return canvas;
    } catch (error) {
        console.error('LSB embedding error:', error);
        throw new Error('Failed to embed data in image: ' + error.message);
    }
}

/**
 * Extracts data from an image using LSB steganography
 * @param {HTMLCanvasElement} canvas - Canvas with the steganographic image
 * @returns {Object} Extracted data {salt, iv, keyBytes, hmac}
 */
export function extractDataFromImage(canvas) {
    try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        const expectedDataLength = SALT_SIZE + IV_SIZE + KEY_SIZE + HMAC_SIZE;
        const totalBytes = HEADER_SIZE + expectedDataLength;
        const allBytes = new Uint8Array(totalBytes);
        let dataIndex = 0;
        let bitIndex = 0;

        for (let i = 0; i < pixels.length && dataIndex < totalBytes; i += 4) {
            for (let channel = 0; channel < 3 && dataIndex < totalBytes; channel++) {
                const pixelIndex = i + channel;
                const bit = pixels[pixelIndex] & 1;
                allBytes[dataIndex] |= (bit << (7 - bitIndex));
                bitIndex++;
                if (bitIndex === 8) {
                    bitIndex = 0;
                    dataIndex++;
                }
            }
        }

        const dataLength = bytesToNumber(allBytes.slice(0, HEADER_SIZE));

        if (dataLength !== expectedDataLength) {
            console.error(`Stego header mismatch: expected ${expectedDataLength}, got ${dataLength} (header bytes: [${allBytes[0]}, ${allBytes[1]}, ${allBytes[2]}, ${allBytes[3]}], canvas: ${canvas.width}x${canvas.height})`);
            throw new Error('Invalid data length - image may not contain valid encryption data');
        }

        let offset = HEADER_SIZE;
        const salt = allBytes.slice(offset, offset + SALT_SIZE);
        offset += SALT_SIZE;
        const iv = allBytes.slice(offset, offset + IV_SIZE);
        offset += IV_SIZE;
        const keyBytes = allBytes.slice(offset, offset + KEY_SIZE);
        offset += KEY_SIZE;
        const hmac = allBytes.slice(offset, offset + HMAC_SIZE);

        return { salt, iv, keyBytes, hmac };
    } catch (error) {
        console.error('LSB extraction error:', error);
        throw new Error('Failed to extract data from image: ' + error.message);
    }
}

/**
 * Loads an image file into a canvas
 * @param {File|Blob} imageFile - Image file to load
 * @returns {Promise<HTMLCanvasElement>} Canvas with loaded image
 */
export function loadImageToCanvas(imageFile) {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            const url = URL.createObjectURL(imageFile);

            img.onload = () => {
                try {
                    // Create canvas with image dimensions
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw image to canvas
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // Clean up
                    URL.revokeObjectURL(url);
                    
                    resolve(canvas);
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to draw image to canvas: ' + error.message));
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        } catch (error) {
            reject(new Error('Failed to process image file: ' + error.message));
        }
    });
}

/**
 * Converts a canvas to a PNG blob
 * @param {HTMLCanvasElement} canvas - Canvas to convert
 * @param {number} quality - JPEG quality (0-1), not used for PNG
 * @returns {Promise<Blob>} PNG blob
 */
export function canvasToBlob(canvas, quality = 1.0) {
    return new Promise((resolve, reject) => {
        try {
            // Use PNG format to preserve LSB data (lossless)
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            }, 'image/png', quality);
        } catch (error) {
            reject(new Error('Failed to convert canvas to blob: ' + error.message));
        }
    });
}

/**
 * Validates if an image has enough capacity for steganography
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {boolean} True if image is large enough
 */
export function validateImageCapacity(width, height) {
    const totalPixels = width * height;
    const totalDataSize = HEADER_SIZE + SALT_SIZE + IV_SIZE + KEY_SIZE + HMAC_SIZE;
    const requiredPixels = Math.ceil((totalDataSize * 8) / 3); // 3 bits per pixel (RGB)
    
    return totalPixels >= requiredPixels;
}

/**
 * Gets the required image dimensions for steganography
 * @returns {Object} {width, height, minPixels}
 */
export function getRequiredImageSize() {
    const totalDataSize = HEADER_SIZE + SALT_SIZE + IV_SIZE + KEY_SIZE + HMAC_SIZE;
    const requiredPixels = Math.ceil((totalDataSize * 8) / 3);
    
    // Return a square image dimension (with some buffer)
    const sideLength = Math.ceil(Math.sqrt(requiredPixels * 1.5));
    
    return {
        width: sideLength,
        height: sideLength,
        minPixels: requiredPixels,
        dataBytes: totalDataSize
    };
}

/**
 * Verifies that an image is in the correct format for steganography
 * @param {File|Blob} imageFile - Image file to verify
 * @returns {Promise<boolean>} True if valid PNG
 */
export async function verifyImageFormat(imageFile) {
    try {
        // Check MIME type
        if (!imageFile.type || imageFile.type !== 'image/png') {
            return false;
        }

        // Check file signature (PNG magic bytes: 89 50 4E 47)
        const header = await imageFile.slice(0, 8).arrayBuffer();
        const bytes = new Uint8Array(header);
        
        return bytes[0] === 0x89 &&
               bytes[1] === 0x50 &&
               bytes[2] === 0x4E &&
               bytes[3] === 0x47;
    } catch (error) {
        console.error('Image format verification error:', error);
        return false;
    }
}

/**
 * Creates a test pattern in an image to verify steganography is working
 * @param {HTMLCanvasElement} canvas - Canvas to test
 * @returns {boolean} True if test passes
 */
export function testSteganography(canvas) {
    try {
        // Create test data
        const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const testSalt = new Uint8Array(SALT_SIZE).fill(1);
        const testIV = new Uint8Array(IV_SIZE).fill(2);
        const testKey = new Uint8Array(KEY_SIZE).fill(3);
        const testHMAC = new Uint8Array(HMAC_SIZE).fill(4);

        // Embed test data
        embedDataInImage(canvas, testSalt, testIV, testHMAC, testKey);

        // Extract and verify
        const extracted = extractDataFromImage(canvas);
        
        return extracted.salt.every((val, idx) => val === testSalt[idx]) &&
               extracted.iv.every((val, idx) => val === testIV[idx]) &&
               extracted.keyBytes.every((val, idx) => val === testKey[idx]) &&
               extracted.hmac.every((val, idx) => val === testHMAC[idx]);
    } catch (error) {
        console.error('Steganography test failed:', error);
        return false;
    }
}
