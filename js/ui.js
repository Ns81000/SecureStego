/**
 * ui.js - UI Interactions and State Management
 * Handles tab switching, progress updates, modals, and animations
 */

'use strict';

/**
 * UI State Manager
 */
class UIState {
    constructor() {
        this.currentTab = 'encrypt';
        this.encryptFile = null;
        this.decryptFile = null;
        this.decryptImage = null;
        this.isProcessing = false;
    }

    setTab(tabName) {
        this.currentTab = tabName;
    }

    setEncryptFile(file) {
        this.encryptFile = file;
    }

    setDecryptFile(file) {
        this.decryptFile = file;
    }

    setDecryptImage(file) {
        this.decryptImage = file;
    }

    setProcessing(processing) {
        this.isProcessing = processing;
    }

    reset() {
        this.encryptFile = null;
        this.decryptFile = null;
        this.decryptImage = null;
        this.isProcessing = false;
    }
}

export const uiState = new UIState();

/**
 * Switches between tabs
 * @param {string} tabId - Tab ID to switch to
 */
export function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    const activeTab = document.getElementById(tabId + 'Tab');
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }

    // Update panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
        panel.setAttribute('hidden', '');
    });

    const activePanel = document.getElementById(tabId + '-panel');
    if (activePanel) {
        activePanel.classList.add('active');
        activePanel.removeAttribute('hidden');
    }

    // Update state
    uiState.setTab(tabId);
}

/**
 * Shows file information in upload zone
 * @param {string} mode - 'encrypt', 'decryptFile', or 'decryptImage'
 * @param {File} file - File to display
 */
export function showFileInfo(mode, file) {
    const zones = {
        'encrypt': {
            info: document.getElementById('encryptFileInfo'),
            name: document.getElementById('encryptFileName'),
            size: document.getElementById('encryptFileSize'),
            zone: document.getElementById('encryptUploadZone')
        },
        'decryptFile': {
            info: document.getElementById('decryptFileInfo'),
            name: document.getElementById('decryptFileName'),
            zone: document.getElementById('decryptFileUploadZone')
        },
        'decryptImage': {
            info: document.getElementById('decryptImageInfo'),
            name: document.getElementById('decryptImageName'),
            zone: document.getElementById('decryptImageUploadZone')
        }
    };

    const elements = zones[mode];
    if (!elements) return;

    // Update file name
    elements.name.textContent = file.name;

    // Update file size if available
    if (elements.size) {
        const size = (file.size / (1024 * 1024)).toFixed(2);
        elements.size.textContent = `${size} MB`;
    }

    // Show file info, hide upload prompt
    elements.zone.querySelector('.upload-content')?.classList.add('hidden');
    elements.info.classList.remove('hidden');
}

/**
 * Clears file information from upload zone
 * @param {string} mode - 'encrypt', 'decryptFile', or 'decryptImage'
 */
export function clearFileInfo(mode) {
    const zones = {
        'encrypt': {
            info: document.getElementById('encryptFileInfo'),
            zone: document.getElementById('encryptUploadZone')
        },
        'decryptFile': {
            info: document.getElementById('decryptFileInfo'),
            zone: document.getElementById('decryptFileUploadZone')
        },
        'decryptImage': {
            info: document.getElementById('decryptImageInfo'),
            zone: document.getElementById('decryptImageUploadZone')
        }
    };

    const elements = zones[mode];
    if (!elements) return;

    // Hide file info, show upload prompt
    elements.info.classList.add('hidden');
    elements.zone.querySelector('.upload-content')?.classList.remove('hidden');
}

/**
 * Updates progress indicator
 * @param {string} mode - 'encrypt' or 'decrypt'
 * @param {Object} progress - Progress data {percentage, processedFormatted, totalFormatted, speed, eta}
 */
export function updateProgress(mode, progress) {
    const containers = {
        'encrypt': {
            container: document.getElementById('encryptProgress'),
            title: document.getElementById('encryptProgressTitle'),
            percent: document.getElementById('encryptProgressPercent'),
            fill: document.getElementById('encryptProgressFill'),
            stat: document.getElementById('encryptProgressStat'),
            speed: document.getElementById('encryptProgressSpeed')
        },
        'decrypt': {
            container: document.getElementById('decryptProgress'),
            title: document.getElementById('decryptProgressTitle'),
            percent: document.getElementById('decryptProgressPercent'),
            fill: document.getElementById('decryptProgressFill'),
            stat: document.getElementById('decryptProgressStat'),
            speed: document.getElementById('decryptProgressSpeed')
        }
    };

    const elements = containers[mode];
    if (!elements) return;

    // Show container
    elements.container.classList.remove('hidden');

    // Update values
    elements.percent.textContent = `${Math.round(progress.percentage)}%`;
    elements.fill.style.width = `${progress.percentage}%`;
    elements.fill.setAttribute('aria-valuenow', Math.round(progress.percentage));

    if (progress.processedFormatted && progress.totalFormatted) {
        elements.stat.textContent = `${progress.processedFormatted} / ${progress.totalFormatted}`;
    }

    if (progress.speed && progress.eta) {
        elements.speed.textContent = `Speed: ${progress.speed} | ETA: ${progress.eta}`;
    }
}

/**
 * Hides progress indicator
 * @param {string} mode - 'encrypt' or 'decrypt'
 */
export function hideProgress(mode) {
    const container = document.getElementById(mode + 'Progress');
    if (container) {
        container.classList.add('hidden');
    }
}

/**
 * Shows success modal
 * @param {string} encryptedFilename - Name of encrypted file
 */
export function showSuccessModal(encryptedFilename) {
    const modal = document.getElementById('successModal');
    const filenameElement = document.getElementById('successEncryptedFile');

    if (filenameElement) {
        filenameElement.textContent = encryptedFilename;
    }

    modal.removeAttribute('hidden');
    modal.removeAttribute('aria-hidden');

    // Focus on close button for accessibility
    setTimeout(() => {
        const closeButton = document.getElementById('successModalClose');
        closeButton?.focus();
    }, 100);
}

/**
 * Hides success modal
 */
export function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    // Move focus out before hiding to avoid aria-hidden focus trap
    const trigger = document.getElementById('encryptButton');
    trigger?.focus();
    modal.setAttribute('hidden', '');
    modal.removeAttribute('aria-hidden');
}

/**
 * Shows error modal
 * @param {string} message - Error message
 */
export function showErrorModal(message) {
    const modal = document.getElementById('errorModal');
    const messageElement = document.getElementById('errorMessage');

    if (messageElement) {
        messageElement.textContent = message;
    }

    modal.removeAttribute('hidden');
    modal.removeAttribute('aria-hidden');

    // Announce to screen readers
    announceToScreenReader(`Error: ${message}`);

    // Focus on close button for accessibility
    setTimeout(() => {
        const closeButton = document.getElementById('errorModalClose');
        closeButton?.focus();
    }, 100);
}

/**
 * Hides error modal
 */
export function hideErrorModal() {
    const modal = document.getElementById('errorModal');
    const trigger = document.getElementById('decryptButton') || document.getElementById('encryptButton');
    trigger?.focus();
    modal.setAttribute('hidden', '');
    modal.removeAttribute('aria-hidden');
}

/**
 * Gets PIN from input boxes
 * @param {string} mode - 'encrypt' or 'decrypt'
 * @returns {string} Complete PIN
 */
export function getPIN(mode) {
    let pin = '';
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`${mode}Pin${i}`);
        pin += input?.value || '';
    }
    return pin;
}

/**
 * Clears PIN input boxes
 * @param {string} mode - 'encrypt' or 'decrypt'
 */
export function clearPIN(mode) {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`${mode}Pin${i}`);
        if (input) {
            input.value = '';
            input.classList.remove('filled', 'error');
        }
    }

    // Focus first input
    const firstInput = document.getElementById(`${mode}Pin1`);
    firstInput?.focus();
}

/**
 * Shows error state on PIN inputs
 * @param {string} mode - 'encrypt' or 'decrypt'
 */
export function showPINError(mode) {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`${mode}Pin${i}`);
        if (input) {
            input.classList.add('error');
        }
    }

    // Remove error class after animation
    setTimeout(() => {
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`${mode}Pin${i}`);
            if (input) {
                input.classList.remove('error');
            }
        }
    }, 500);
}

/**
 * Enables or disables the action button
 * @param {string} mode - 'encrypt' or 'decrypt'
 * @param {boolean} enabled - Whether to enable
 */
export function setButtonEnabled(mode, enabled) {
    const button = document.getElementById(`${mode}Button`);
    if (button) {
        button.disabled = !enabled;
    }
}

/**
 * Sets loading state on button
 * @param {string} mode - 'encrypt' or 'decrypt'
 * @param {boolean} loading - Whether loading
 */
export function setButtonLoading(mode, loading) {
    const button = document.getElementById(`${mode}Button`);
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        const originalText = button.querySelector('span').textContent;
        button.dataset.originalText = originalText;
        button.querySelector('span').textContent = mode === 'encrypt' ? 'Encrypting...' : 'Decrypting...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        if (button.dataset.originalText) {
            button.querySelector('span').textContent = button.dataset.originalText;
        }
    }
}

/**
 * Announces message to screen readers
 * @param {string} message - Message to announce
 */
export function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Shows a toast notification (simple version)
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
export function showToast(message, type = 'info') {
    // Simple implementation - could be enhanced
    console.log(`[${type.toUpperCase()}] ${message}`);
    announceToScreenReader(message);
}

export function isEncryptionReady() {
    return uiState.encryptFile !== null && getPIN('encrypt').length === 6;
}

/**
 * Checks if all required inputs are filled for decryption
 * @returns {boolean} True if ready
 */
export function isDecryptionReady() {
    return uiState.decryptFile !== null && 
           uiState.decryptImage !== null && 
           getPIN('decrypt').length === 6;
}

/**
 * Updates button states based on form completion
 */
export function updateButtonStates() {
    setButtonEnabled('encrypt', isEncryptionReady() && !uiState.isProcessing);
    setButtonEnabled('decrypt', isDecryptionReady() && !uiState.isProcessing);
}
