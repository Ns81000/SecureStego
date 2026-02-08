/**
 * app.js - Main Application Entry Point
 * Initializes the application and coordinates all modules
 */

'use strict';

import * as crypto from './crypto.js';
import * as stego from './steganography.js';
import * as imageGen from './imageGenerator.js';
import * as fileHandler from './fileHandler.js';
import * as validation from './validation.js';
import * as ui from './ui.js';

/**
 * Initialize the application
 */
async function init() {
    try {
        // Check browser support
        checkBrowserSupport();

        // Initialize tabs
        initializeTabs();

        // Initialize file uploads
        initializeFileUploads();

        // Initialize PIN inputs
        initializePINInputs();

        // Initialize action buttons
        initializeActionButtons();

        // Initialize modals
        initializeModals();

        console.log('✅ SecureStego Vault initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        ui.showErrorModal('Failed to initialize application: ' + error.message);
    }
}

/**
 * Check if browser supports required features
 */
function checkBrowserSupport() {
    const support = validation.checkBrowserSupport();

    if (!support.supported) {
        const message = `Your browser is missing required features:\n${support.missing.join('\n')}`;
        ui.showErrorModal(message);
        throw new Error('Browser not supported');
    }

    if (!crypto.isCryptoAvailable()) {
        ui.showErrorModal('Web Crypto API is not available. Please use HTTPS or localhost.');
        throw new Error('Crypto API not available');
    }
}

/**
 * Initialize tab switching
 */
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.id.replace('Tab', '');
            ui.switchTab(tabId);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'e') {
                e.preventDefault();
                ui.switchTab('encrypt');
            } else if (e.key === 'd') {
                e.preventDefault();
                ui.switchTab('decrypt');
            }
        }
    });
}

/**
 * Initialize file upload zones
 */
function initializeFileUploads() {
    // Encrypt file upload
    const encryptZone = document.getElementById('encryptUploadZone');
    const encryptInput = document.getElementById('encryptFileInput');
    const encryptRemove = document.getElementById('encryptFileRemove');

    fileHandler.setupDragAndDrop(encryptZone, (file) => {
        handleEncryptFileSelected(file);
    });

    fileHandler.setupFileInput(encryptInput, (file) => {
        handleEncryptFileSelected(file);
    });

    encryptRemove?.addEventListener('click', () => {
        ui.uiState.setEncryptFile(null);
        ui.clearFileInfo('encrypt');
        fileHandler.clearFileInput(encryptInput);
        ui.updateButtonStates();
    });

    // Decrypt file upload
    const decryptFileZone = document.getElementById('decryptFileUploadZone');
    const decryptFileInput = document.getElementById('decryptFileInput');
    const decryptFileRemove = document.getElementById('decryptFileRemove');

    fileHandler.setupDragAndDrop(decryptFileZone, (file) => {
        handleDecryptFileSelected(file);
    });

    fileHandler.setupFileInput(decryptFileInput, (file) => {
        handleDecryptFileSelected(file);
    });

    decryptFileRemove?.addEventListener('click', () => {
        ui.uiState.setDecryptFile(null);
        ui.clearFileInfo('decryptFile');
        fileHandler.clearFileInput(decryptFileInput);
        ui.updateButtonStates();
    });

    // Decrypt image upload
    const decryptImageZone = document.getElementById('decryptImageUploadZone');
    const decryptImageInput = document.getElementById('decryptImageInput');
    const decryptImageRemove = document.getElementById('decryptImageRemove');

    fileHandler.setupDragAndDrop(decryptImageZone, (file) => {
        handleDecryptImageSelected(file);
    });

    fileHandler.setupFileInput(decryptImageInput, (file) => {
        handleDecryptImageSelected(file);
    });

    decryptImageRemove?.addEventListener('click', () => {
        ui.uiState.setDecryptImage(null);
        ui.clearFileInfo('decryptImage');
        fileHandler.clearFileInput(decryptImageInput);
        ui.updateButtonStates();
    });
}

/**
 * Handle encrypt file selection
 */
function handleEncryptFileSelected(file) {
    const validationResult = validation.validateEncryptionFile(file);

    if (!validationResult.valid) {
        ui.showErrorModal(validationResult.error);
        return;
    }

    ui.uiState.setEncryptFile(file);
    ui.showFileInfo('encrypt', file);
    ui.updateButtonStates();
    ui.announceToScreenReader(`File selected: ${file.name}`);
}

/**
 * Handle decrypt file selection
 */
function handleDecryptFileSelected(file) {
    const validationResult = validation.validateEncryptedFile(file);

    if (!validationResult.valid) {
        ui.showErrorModal(validationResult.error);
        return;
    }

    if (validationResult.warning) {
        ui.showToast(validationResult.warning, 'warning');
    }

    ui.uiState.setDecryptFile(file);
    ui.showFileInfo('decryptFile', file);
    ui.updateButtonStates();
    ui.announceToScreenReader(`Encrypted file selected: ${file.name}`);
}

/**
 * Handle decrypt image selection
 */
function handleDecryptImageSelected(file) {
    const validationResult = validation.validateKeyImage(file);

    if (!validationResult.valid) {
        ui.showErrorModal(validationResult.error);
        return;
    }

    if (validationResult.warning) {
        ui.showToast(validationResult.warning, 'warning');
    }

    ui.uiState.setDecryptImage(file);
    ui.showFileInfo('decryptImage', file);
    ui.updateButtonStates();
    ui.announceToScreenReader(`Key image selected: ${file.name}`);
}

/**
 * Initialize PIN input boxes
 */
function initializePINInputs() {
    initializePINGroup('encrypt');
    initializePINGroup('decrypt');
}

/**
 * Initialize a PIN input group
 */
function initializePINGroup(mode) {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`${mode}Pin${i}`);
        if (!input) continue;

        input.addEventListener('input', (e) => {
            const value = e.target.value;

            // Only allow digits
            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }

            // Mark as filled
            e.target.classList.add('filled');

            // Auto-focus next box
            if (value && i < 6) {
                const nextInput = document.getElementById(`${mode}Pin${i + 1}`);
                nextInput?.focus();
            }

            // Check if all filled
            if (i === 6 && ui.getPIN(mode).length === 6) {
                ui.updateButtonStates();
            }
        });

        input.addEventListener('keydown', (e) => {
            // Handle backspace
            if (e.key === 'Backspace' && !e.target.value && i > 1) {
                const prevInput = document.getElementById(`${mode}Pin${i - 1}`);
                prevInput?.focus();
                prevInput.classList.remove('filled');
            }

            // Handle paste
            if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handlePINPaste(mode);
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            handlePINPaste(mode);
        });

        input.addEventListener('blur', () => {
            ui.updateButtonStates();
        });
    }
}

/**
 * Handle PIN paste
 */
function handlePINPaste(mode) {
    navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').substring(0, 6);

        if (digits.length === 6) {
            for (let i = 0; i < 6; i++) {
                const input = document.getElementById(`${mode}Pin${i + 1}`);
                if (input) {
                    input.value = digits[i];
                    input.classList.add('filled');
                }
            }
            ui.updateButtonStates();
            ui.announceToScreenReader('PIN pasted');
        }
    }).catch(err => {
        console.error('Paste failed:', err);
    });
}

/**
 * Initialize action buttons
 */
function initializeActionButtons() {
    // Encrypt button
    const encryptButton = document.getElementById('encryptButton');
    encryptButton?.addEventListener('click', handleEncrypt);

    // Decrypt button
    const decryptButton = document.getElementById('decryptButton');
    decryptButton?.addEventListener('click', handleDecrypt);

    // Download buttons
    const downloadEncryptedBtn = document.getElementById('downloadEncryptedBtn');
    downloadEncryptedBtn?.addEventListener('click', handleDownloadEncrypted);

    const downloadKeyImageBtn = document.getElementById('downloadKeyImageBtn');
    downloadKeyImageBtn?.addEventListener('click', handleDownloadKeyImage);

    const downloadZipBtn = document.getElementById('downloadZipBtn');
    downloadZipBtn?.addEventListener('click', handleDownloadZip);
}

/**
 * Handle encryption
 */
async function handleEncrypt() {
    try {
        ui.uiState.setProcessing(true);
        ui.setButtonLoading('encrypt', true);
        ui.updateButtonStates();

        const file = ui.uiState.encryptFile;
        const pin = ui.getPIN('encrypt');

        // Validate inputs
        const inputValidation = validation.validateEncryptionInputs(file, pin);
        if (!inputValidation.valid) {
            throw new Error(validation.formatValidationErrors(inputValidation.errors));
        }

        // Show progress
        const tracker = fileHandler.createProgressTracker(file.size);
        ui.updateProgress('encrypt', { percentage: 0, processedFormatted: '0', totalFormatted: fileHandler.formatFileSize(file.size), speed: '', eta: '' });

        // Encrypt file
        ui.announceToScreenReader('Encrypting file...');
        const encryptResult = await crypto.encryptFile(file, pin, (progress) => {
            tracker.update((progress / 100) * file.size);
            ui.updateProgress('encrypt', tracker.getProgress());
        });

        // Generate abstract image
        ui.announceToScreenReader('Generating key image...');
        const canvas = await imageGen.generateAbstractImage();

        // Export key
        const keyBytes = await crypto.exportKey(encryptResult.key);

        // Embed data in image
        ui.announceToScreenReader('Embedding encryption key...');
        stego.embedDataInImage(canvas, encryptResult.salt, encryptResult.iv, encryptResult.hmac, keyBytes);

        // Convert canvas to PNG
        const imageBlob = await stego.canvasToBlob(canvas);

        // Save files for download
        window.encryptedFileData = {
            encrypted: encryptResult.encrypted,
            image: imageBlob,
            originalFilename: file.name
        };

        // Hide progress, show success
        ui.hideProgress('encrypt');
        ui.showSuccessModal(file.name + '.encrypted');

        ui.announceToScreenReader('Encryption complete!');

        // Clear sensitive data
        crypto.clearSensitiveData(keyBytes);

    } catch (error) {
        console.error('Encryption error:', error);
        ui.hideProgress('encrypt');
        ui.showErrorModal(crypto.getCryptoErrorMessage(error));
        ui.showPINError('encrypt');
    } finally {
        ui.uiState.setProcessing(false);
        ui.setButtonLoading('encrypt', false);
        ui.updateButtonStates();
    }
}

/**
 * Handle decryption
 */
async function handleDecrypt() {
    try {
        ui.uiState.setProcessing(true);
        ui.setButtonLoading('decrypt', true);
        ui.updateButtonStates();

        const encryptedFile = ui.uiState.decryptFile;
        const keyImage = ui.uiState.decryptImage;
        const pin = ui.getPIN('decrypt');

        // Validate inputs
        const inputValidation = validation.validateDecryptionInputs(encryptedFile, keyImage, pin);
        if (!inputValidation.valid) {
            throw new Error(validation.formatValidationErrors(inputValidation.errors));
        }

        // Show progress
        const tracker = fileHandler.createProgressTracker(encryptedFile.size);
        ui.updateProgress('decrypt', { percentage: 0, processedFormatted: '0', totalFormatted: fileHandler.formatFileSize(encryptedFile.size), speed: '', eta: '' });

        // Load image and extract data
        ui.announceToScreenReader('Extracting encryption key from image...');
        const canvas = await stego.loadImageToCanvas(keyImage);
        const extractedData = stego.extractDataFromImage(canvas);

        // Decrypt file using PIN + extracted parameters
        ui.announceToScreenReader('Decrypting file...');
        const decryptedBlob = await crypto.decryptFile(
            encryptedFile,
            pin,
            extractedData.salt,
            extractedData.iv,
            extractedData.hmac,
            (progress) => {
                tracker.update((progress / 100) * encryptedFile.size);
                ui.updateProgress('decrypt', tracker.getProgress());
            }
        );

        // Download decrypted file
        const originalFilename = encryptedFile.name.replace('.encrypted', '');
        fileHandler.downloadBlob(decryptedBlob, originalFilename);

        // Hide progress
        ui.hideProgress('decrypt');

        ui.announceToScreenReader('Decryption complete! File downloaded.');
        ui.showToast('File decrypted successfully!', 'success');

        // Clear form
        setTimeout(() => {
            ui.uiState.reset();
            ui.clearFileInfo('decryptFile');
            ui.clearFileInfo('decryptImage');
            ui.clearPIN('decrypt');
            ui.updateButtonStates();
        }, 1000);

        // Clear sensitive data
        crypto.clearSensitiveData(extractedData.keyBytes);

    } catch (error) {
        console.error('Decryption error:', error);
        ui.hideProgress('decrypt');
        ui.showErrorModal(crypto.getCryptoErrorMessage(error));
        ui.showPINError('decrypt');
    } finally {
        ui.uiState.setProcessing(false);
        ui.setButtonLoading('decrypt', false);
        ui.updateButtonStates();
    }
}

/**
 * Handle download both files
 */
function handleDownloadEncrypted() {
    if (!window.encryptedFileData) return;
    const data = window.encryptedFileData;
    fileHandler.downloadBlob(data.encrypted, data.originalFilename + '.encrypted');
    ui.announceToScreenReader('Encrypted file downloaded');
}

function handleDownloadKeyImage() {
    if (!window.encryptedFileData) return;
    const data = window.encryptedFileData;
    fileHandler.downloadBlob(data.image, 'key-image.png');
    ui.announceToScreenReader('Key image downloaded');
}

async function handleDownloadZip() {
    if (!window.encryptedFileData) return;
    const data = window.encryptedFileData;

    try {
        const encryptedBuf = await data.encrypted.arrayBuffer();
        const imageBuf = await data.image.arrayBuffer();

        const encFileName = data.originalFilename + '.encrypted';
        const zipBlob = createZip([
            { name: encFileName, data: new Uint8Array(encryptedBuf) },
            { name: 'key-image.png', data: new Uint8Array(imageBuf) }
        ]);

        const baseName = data.originalFilename.replace(/\.[^.]+$/, '');
        fileHandler.downloadBlob(zipBlob, baseName + '-securestego.zip');

        ui.hideSuccessModal();
        ui.announceToScreenReader('ZIP file downloaded');

        setTimeout(() => {
            ui.uiState.reset();
            ui.clearFileInfo('encrypt');
            ui.clearPIN('encrypt');
            ui.updateButtonStates();
            window.encryptedFileData = null;
        }, 500);
    } catch (error) {
        console.error('ZIP creation error:', error);
        ui.showErrorModal('Failed to create ZIP file. Please download files individually.');
    }
}

function createZip(files) {
    const parts = [];
    const centralDir = [];
    let offset = 0;

    for (const file of files) {
        const nameBytes = new TextEncoder().encode(file.name);
        const crc = crc32(file.data);

        // Local file header
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const lv = new DataView(localHeader.buffer);
        lv.setUint32(0, 0x04034b50, true);  // signature
        lv.setUint16(4, 20, true);           // version needed
        lv.setUint16(6, 0, true);            // flags
        lv.setUint16(8, 0, true);            // compression (store)
        lv.setUint16(10, 0, true);           // mod time
        lv.setUint16(12, 0, true);           // mod date
        lv.setUint32(14, crc, true);         // crc-32
        lv.setUint32(18, file.data.length, true);  // compressed size
        lv.setUint32(22, file.data.length, true);  // uncompressed size
        lv.setUint16(26, nameBytes.length, true);  // name length
        lv.setUint16(28, 0, true);           // extra length
        localHeader.set(nameBytes, 30);

        parts.push(localHeader, file.data);

        // Central directory entry
        const cdEntry = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(cdEntry.buffer);
        cv.setUint32(0, 0x02014b50, true);   // signature
        cv.setUint16(4, 20, true);           // version made by
        cv.setUint16(6, 20, true);           // version needed
        cv.setUint16(8, 0, true);            // flags
        cv.setUint16(10, 0, true);           // compression
        cv.setUint16(12, 0, true);           // mod time
        cv.setUint16(14, 0, true);           // mod date
        cv.setUint32(16, crc, true);         // crc-32
        cv.setUint32(20, file.data.length, true);
        cv.setUint32(24, file.data.length, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);           // extra length
        cv.setUint16(32, 0, true);           // comment length
        cv.setUint16(34, 0, true);           // disk number
        cv.setUint16(36, 0, true);           // internal attrs
        cv.setUint32(38, 0, true);           // external attrs
        cv.setUint32(42, offset, true);      // local header offset
        cdEntry.set(nameBytes, 46);

        centralDir.push(cdEntry);
        offset += localHeader.length + file.data.length;
    }

    const cdSize = centralDir.reduce((sum, e) => sum + e.length, 0);

    // End of central directory
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...parts, ...centralDir, eocd], { type: 'application/zip' });
}

function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Initialize modals
 */
function initializeModals() {
    // Success modal close
    const successClose = document.getElementById('successModalClose');
    const successOverlay = document.getElementById('successModalOverlay');

    successClose?.addEventListener('click', ui.hideSuccessModal);
    successOverlay?.addEventListener('click', ui.hideSuccessModal);

    // Error modal close
    const errorClose = document.getElementById('errorModalClose');
    const errorOverlay = document.getElementById('errorModalOverlay');
    const errorBtn = document.getElementById('errorModalBtn');

    errorClose?.addEventListener('click', ui.hideErrorModal);
    errorOverlay?.addEventListener('click', ui.hideErrorModal);
    errorBtn?.addEventListener('click', ui.hideErrorModal);

    // Keyboard navigation for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ui.hideSuccessModal();
            ui.hideErrorModal();
        }
    });
}

// Initialize on DOM loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.SecureStegoVault = {
    crypto,
    stego,
    imageGen,
    fileHandler,
    validation,
    ui
};
