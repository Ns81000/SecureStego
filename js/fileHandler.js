/**
 * fileHandler.js - File Upload, Download, and Processing
 * Handles drag-drop, file reading, and blob management
 */

'use strict';

// Constants
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

/**
 * Formats file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates file size
 * @param {File} file - File to validate
 * @returns {boolean} True if file size is acceptable
 */
export function validateFileSize(file) {
    return file.size > 0 && file.size <= MAX_FILE_SIZE;
}

/**
 * Gets file extension
 * @param {string} filename - Filename
 * @returns {string} File extension (with dot)
 */
export function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
}

/**
 * Sanitizes filename to prevent issues
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
    // Remove or replace unsafe characters
    return filename
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .substring(0, 255); // Max filename length
}

/**
 * Reads file as ArrayBuffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>} File contents
 */
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Reads file in chunks with progress callback
 * @param {File} file - File to read
 * @param {Function} progressCallback - Called with (loadedBytes, totalBytes)
 * @returns {Promise<ArrayBuffer>} File contents
 */
export async function readFileInChunks(file, progressCallback = null) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let offset = 0;
        const chunks = [];

        reader.onload = (e) => {
            chunks.push(new Uint8Array(e.target.result));
            offset += e.target.result.byteLength;
            
            progressCallback?.(offset, file.size);

            if (offset < file.size) {
                readNextChunk();
            } else {
                // Combine all chunks
                const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                const combined = new Uint8Array(totalLength);
                let position = 0;
                
                for (const chunk of chunks) {
                    combined.set(chunk, position);
                    position += chunk.length;
                }
                
                resolve(combined.buffer);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        function readNextChunk() {
            const slice = file.slice(offset, offset + CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        }

        readNextChunk();
    });
}

/**
 * Downloads a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Desired filename
 */
export function downloadBlob(blob, filename) {
    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = sanitizeFilename(filename);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
        console.error('Download error:', error);
        throw new Error('Failed to download file: ' + error.message);
    }
}

/**
 * Downloads multiple files as a ZIP (requires JSZip or similar)
 * For now, downloads them separately
 * @param {Array} files - Array of {blob, filename} objects
 */
export function downloadMultipleFiles(files) {
    files.forEach((file, index) => {
        setTimeout(() => {
            downloadBlob(file.blob, file.filename);
        }, index * 500); // Stagger downloads
    });
}

/**
 * Sets up drag and drop functionality for an element
 * @param {HTMLElement} element - Element to make droppable
 * @param {Function} onDrop - Callback when file is dropped
 * @returns {Function} Cleanup function
 */
export function setupDragAndDrop(element, onDrop) {
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.add('dragover');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === element) {
            element.classList.remove('dragover');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onDrop(files[0]); // Take first file
        }
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);

    // Return cleanup function
    return () => {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
    };
}

/**
 * Creates a file input change handler
 * @param {HTMLInputElement} input - File input element
 * @param {Function} onChange - Callback when file is selected
 * @returns {Function} Cleanup function
 */
export function setupFileInput(input, onChange) {
    const handleChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onChange(files[0]);
        }
    };

    input.addEventListener('change', handleChange);

    return () => {
        input.removeEventListener('change', handleChange);
    };
}

/**
 * Clears a file input
 * @param {HTMLInputElement} input - File input to clear
 */
export function clearFileInput(input) {
    input.value = '';
}

/**
 * Gets file information
 * @param {File} file - File to inspect
 * @returns {Object} File information
 */
export function getFileInfo(file) {
    return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        extension: getFileExtension(file.name),
        sizeFormatted: formatFileSize(file.size)
    };
}

/**
 * Estimates processing time based on file size
 * @param {number} fileSize - File size in bytes
 * @param {number} speed - Processing speed in MB/s
 * @returns {string} Estimated time string
 */
export function estimateProcessingTime(fileSize, speed = 50) {
    const seconds = fileSize / (speed * 1024 * 1024);
    
    if (seconds < 1) {
        return '< 1 second';
    } else if (seconds < 60) {
        return `~${Math.ceil(seconds)} seconds`;
    } else {
        const minutes = Math.ceil(seconds / 60);
        return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
}

/**
 * Creates a progress tracker for file operations
 * @param {number} totalSize - Total size in bytes
 * @returns {Object} Progress tracker
 */
export function createProgressTracker(totalSize) {
    let startTime = Date.now();
    let lastUpdate = startTime;
    let processedSize = 0;

    return {
        update(currentSize) {
            processedSize = currentSize;
            lastUpdate = Date.now();
        },

        getProgress() {
            const percentage = (processedSize / totalSize) * 100;
            const elapsed = (Date.now() - startTime) / 1000; // seconds
            const speed = elapsed > 0 ? processedSize / elapsed : 0; // bytes per second
            const remaining = speed > 0 ? (totalSize - processedSize) / speed : 0;

            return {
                percentage: Math.min(percentage, 100),
                processedSize: processedSize,
                totalSize: totalSize,
                processedFormatted: formatFileSize(processedSize),
                totalFormatted: formatFileSize(totalSize),
                speed: formatFileSize(speed) + '/s',
                speedRaw: speed,
                eta: formatTime(remaining),
                etaSeconds: remaining,
                elapsed: formatTime(elapsed)
            };
        },

        reset() {
            startTime = Date.now();
            lastUpdate = startTime;
            processedSize = 0;
        }
    };
}

/**
 * Formats time in seconds to human-readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    if (seconds < 1) {
        return '< 1s';
    } else if (seconds < 60) {
        return `${Math.ceil(seconds)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.ceil(seconds % 60);
        return `${minutes}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.ceil((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

/**
 * Checks if browser supports required File APIs
 * @returns {boolean} True if supported
 */
export function checkFileAPISupport() {
    return typeof File !== 'undefined' &&
           typeof Blob !== 'undefined' &&
           typeof FileReader !== 'undefined' &&
           typeof URL !== 'undefined' &&
           typeof URL.createObjectURL === 'function';
}

/**
 * Converts a data URL to a Blob
 * @param {string} dataUrl - Data URL
 * @returns {Blob} Converted blob
 */
export function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    
    return new Blob([array], { type: mime });
}

/**
 * Gets max file size
 * @returns {number} Max file size in bytes
 */
export function getMaxFileSize() {
    return MAX_FILE_SIZE;
}

/**
 * Gets chunk size
 * @returns {number} Chunk size in bytes
 */
export function getChunkSize() {
    return CHUNK_SIZE;
}
