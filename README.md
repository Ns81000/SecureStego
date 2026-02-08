<p align="center">
  <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-blueviolet?style=for-the-badge&logo=shieldsdotio&logoColor=white" alt="AES-256-GCM" />
  <img src="https://img.shields.io/badge/Zero--Knowledge-Client%20Side-34d399?style=for-the-badge&logo=gnuprivacyguard&logoColor=white" alt="Zero Knowledge" />
  <img src="https://img.shields.io/badge/No%20Dependencies-Vanilla%20JS-f59e0b?style=for-the-badge&logo=javascript&logoColor=white" alt="Vanilla JS" />
</p>

<h1 align="center">
  🔐 SecureStego Vault
</h1>

<p align="center">
  <strong>Encrypt files. Hide keys in art. Zero servers.</strong><br/>
  A zero-knowledge, client-side web application that encrypts your files with military-grade AES-256-GCM<br/>
  and hides the encryption keys inside beautiful procedurally generated abstract images.
</p>

<p align="center">
  <a href="https://github.com/Ns81000/SecureStego/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Ns81000/SecureStego?style=flat-square&color=a855f7" alt="License" /></a>
  <a href="https://github.com/Ns81000/SecureStego/stargazers"><img src="https://img.shields.io/github/stars/Ns81000/SecureStego?style=flat-square&color=f59e0b" alt="Stars" /></a>
  <a href="https://github.com/Ns81000/SecureStego/network/members"><img src="https://img.shields.io/github/forks/Ns81000/SecureStego?style=flat-square&color=34d399" alt="Forks" /></a>
  <a href="https://github.com/Ns81000/SecureStego/issues"><img src="https://img.shields.io/github/issues/Ns81000/SecureStego?style=flat-square&color=ef4444" alt="Issues" /></a>
  <a href="https://github.com/Ns81000/SecureStego"><img src="https://img.shields.io/github/repo-size/Ns81000/SecureStego?style=flat-square&color=6366f1" alt="Repo Size" /></a>
  <a href="https://github.com/Ns81000/SecureStego/commits/main"><img src="https://img.shields.io/github/last-commit/Ns81000/SecureStego?style=flat-square&color=a855f7" alt="Last Commit" /></a>
</p>

<p align="center">
  <a href="https://ns81000.github.io/SecureStego/">🚀 Live Demo</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-how-it-works">🔐 How It Works</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="docs/security.md">📖 Security Docs</a> •
  <a href="https://github.com/Ns81000/SecureStego/issues">🐛 Report Bug</a>
</p>

<br/>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ns81000/SecureStego/main/docs/assets/preview-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Ns81000/SecureStego/main/docs/assets/preview-dark.png" />
    <img alt="SecureStego Vault Preview" src="https://raw.githubusercontent.com/Ns81000/SecureStego/main/docs/assets/preview-dark.png" width="800" />
  </picture>
</p>

---

## 📑 Table of Contents

- [Features](#-features)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Security](#-security)
- [Browser Compatibility](#-browser-compatibility)
- [Image Generation](#-image-generation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

<table>
  <tr>
    <td width="50%">

### 🔒 Military-Grade Encryption

AES-256-GCM with PBKDF2-SHA256 key derivation (100,000 iterations). Authenticated encryption that prevents both eavesdropping **and** tampering.

### 🎨 Steganography

Encryption keys are hidden inside procedurally generated abstract art using LSB encoding — invisible to the human eye, lossless in PNG format.

### 🔐 Zero-Knowledge Architecture

**Everything** runs in your browser. No servers, no uploads, no tracking. Your files never leave your device.

  </td>
  <td width="50%">

### ⚡ High Performance

Handles files up to 1GB with real-time progress tracking. Chunked processing keeps memory usage efficient.

### 🌐 Zero Dependencies

Pure vanilla JavaScript — no npm, no frameworks, no CDNs. The entire app is self-contained and auditable.

### ♿ Fully Accessible

WCAG 2.1 AAA compliant with full keyboard navigation, ARIA labels, focus management, and screen reader support.

  </td>
  </tr>
</table>

<details>
<summary><strong>🔍 View All Features</strong></summary>
<br/>

| Category | Feature | Details |
|----------|---------|---------|
| 🔒 Crypto | AES-256-GCM | 256-bit key, 12-byte IV, 128-bit auth tag |
| 🔑 KDF | PBKDF2-SHA256 | 100,000 iterations, 16-byte random salt |
| ✅ Integrity | HMAC-SHA256 | Double verification (GCM tag + HMAC) |
| 🎲 RNG | `crypto.getRandomValues()` | OS-level CSPRNG entropy source |
| 🖼️ Stego | LSB Encoding | RGB channels, only 96 bytes in 540KB capacity |
| 📱 UI | Responsive | Optimized for desktop, tablet, and mobile |
| 🎨 Theme | Dark Mode | Purple & emerald glassmorphism design |
| 📦 Download | Flexible | Individual files or combined ZIP download |
| 🧹 Memory | Auto-clear | Sensitive data zeroed after use |
| 🛡️ Errors | Generic | Doesn't reveal failure causes to attackers |

</details>

---

## 🔐 How It Works

### Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENCRYPTION                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📄 File + 🔢 PIN                                                  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐                    │
│  │ Generate  │───▶│  PBKDF2   │───▶│ AES-256   │                    │
│  │ Salt + IV │    │ Key Deriv │    │ GCM Enc   │                    │
│  └──────────┘    └───────────┘    └─────┬─────┘                    │
│                                         │                           │
│                                         ▼                           │
│                                  ┌────────────┐                    │
│                                  │ HMAC-SHA256 │                    │
│                                  │ Integrity   │                    │
│                                  └──────┬─────┘                    │
│                                         │                           │
│       ┌─────────────────────────────────┤                           │
│       │                                 │                           │
│       ▼                                 ▼                           │
│  ┌──────────┐                    ┌────────────┐                    │
│  │ Generate  │                    │  Embed via  │                    │
│  │ Abstract  │───────────────────▶│  LSB Stego  │                    │
│  │ Art 🎨   │                    │ (96 bytes)  │                    │
│  └──────────┘                    └──────┬─────┘                    │
│                                         │                           │
│       ┌─────────────────────────────────┤                           │
│       │                                 │                           │
│       ▼                                 ▼                           │
│  📦 .encrypted file              🖼️ Key Image (PNG)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Decryption Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DECRYPTION                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📦 .encrypted + 🖼️ Key Image + 🔢 PIN                            │
│       │               │                                             │
│       │               ▼                                             │
│       │         ┌────────────┐                                     │
│       │         │ LSB Extract │──▶ Salt + IV + Key + HMAC          │
│       │         └────────────┘                                     │
│       │               │                                             │
│       │               ▼                                             │
│       │         ┌────────────┐                                     │
│       │         │  PBKDF2    │──▶ Derive Key from PIN + Salt       │
│       │         └────────────┘                                     │
│       │               │                                             │
│       │               ▼                                             │
│       │         ┌────────────┐                                     │
│       │         │ Verify     │──▶ HMAC Check ✅                    │
│       │         │ Integrity  │                                     │
│       │         └────────────┘                                     │
│       │               │                                             │
│       ▼               ▼                                             │
│  ┌──────────────────────────┐                                      │
│  │    AES-256-GCM Decrypt   │                                      │
│  └────────────┬─────────────┘                                      │
│               │                                                     │
│               ▼                                                     │
│          📄 Original File                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Steganography Data Layout

```
Embedded Data (96 bytes total):
┌────────────┬────────────┬──────────┬──────────────┬──────────────┐
│ Data Length │    Salt    │    IV    │ Derived Key  │  HMAC Hash   │
│  (4 bytes) │ (16 bytes) │(12 bytes)│  (32 bytes)  │  (32 bytes)  │
└────────────┴────────────┴──────────┴──────────────┴──────────────┘
   uint32BE     Random       Random    PBKDF2 output  SHA-256 HMAC
```

> 💡 **Only 96 bytes** are embedded in a 1200×1200 image — that's **0.018%** of the total capacity (540,000 bytes). The changes are completely invisible to the human eye.

---

## 🏗️ Architecture

```
securestego-vault/
│
├── 📄 index.html                 ← Single-page application
│
├── 🎨 css/
│   ├── reset.css                 ← Browser normalization
│   ├── variables.css             ← Design tokens (dark mode, colors)
│   ├── components.css            ← All UI component styles
│   ├── utilities.css             ← Helper classes
│   └── responsive.css            ← Breakpoints (480–1400px)
│
├── ⚙️ js/
│   ├── app.js                    ← Entry point, orchestration, ZIP creator
│   ├── crypto.js                 ← Web Crypto API (AES, PBKDF2, HMAC)
│   ├── steganography.js          ← LSB encode/decode engine
│   ├── imageGenerator.js         ← 6 procedural art algorithms
│   ├── fileHandler.js            ← File read/write/download
│   ├── validation.js             ← Input sanitization & checks
│   └── ui.js                     ← DOM state, modals, focus management
│
├── 📖 docs/
│   └── security.md               ← Full cryptographic documentation
│
├── 📦 manifest.json              ← PWA manifest
└── 📘 README.md                  ← You are here
```

### Module Dependency Graph

```
app.js (Entry Point)
  ├── crypto.js          ── Web Crypto API operations
  ├── steganography.js   ── LSB pixel manipulation
  ├── imageGenerator.js  ── Canvas procedural art
  ├── fileHandler.js     ── Blob/File I/O
  ├── validation.js      ── Input guards
  └── ui.js              ── DOM & accessibility
```

---

## 🚀 Quick Start

### Option 1 — Use Online

Visit the **[Live Demo](https://ns81000.github.io/SecureStego/)** — nothing to install.

### Option 2 — Run Locally

```bash
# Clone the repository
git clone https://github.com/Ns81000/SecureStego.git

# Navigate to the project
cd SecureStego

# Serve with any static server (HTTPS or localhost required)
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# Or use VS Code Live Server extension
```

Then open **http://localhost:8000** in your browser.

### Usage

<table>
  <tr>
    <th>🔒 Encrypt</th>
    <th>🔓 Decrypt</th>
  </tr>
  <tr>
    <td>
      1. Drop or select a file<br/>
      2. Enter a 6-digit PIN<br/>
      3. Click <strong>Encrypt File</strong><br/>
      4. Download encrypted file + key image<br/>
      5. Share PIN separately!
    </td>
    <td>
      1. Upload the <code>.encrypted</code> file<br/>
      2. Upload the key image (PNG)<br/>
      3. Enter the same 6-digit PIN<br/>
      4. Click <strong>Decrypt File</strong><br/>
      5. Download original file ✅
    </td>
  </tr>
</table>

> ⚠️ **Important**: Never share the encrypted file, key image, AND PIN together through the same channel. Use separate communication methods for each.

---

## 🛡️ Security

### Cryptographic Specifications

| Component | Algorithm | Parameters |
|:----------|:----------|:-----------|
| **Encryption** | AES-256-GCM | 256-bit key, 12-byte IV, 128-bit auth tag |
| **Key Derivation** | PBKDF2-SHA256 | 100,000 iterations, 16-byte salt |
| **Integrity** | HMAC-SHA256 | 256-bit keyed hash |
| **Steganography** | LSB (Least Significant Bit) | RGB channels, PNG lossless |
| **RNG** | `crypto.getRandomValues()` | CSPRNG (OS-level entropy) |

### Security Guarantees

| Guarantee | Status |
|:----------|:------:|
| Zero-Knowledge — files never leave your device | ✅ |
| No Logging — PINs, keys, and contents are never stored | ✅ |
| Authenticated Encryption — GCM prevents tampering | ✅ |
| Forward Secrecy — unique salt + IV per file | ✅ |
| Memory Safety — sensitive data cleared after use | ✅ |
| Generic Errors — doesn't reveal failure causes | ✅ |
| NIST Compliance — AES, PBKDF2, HMAC all NIST-approved | ✅ |

### Best Practices

> 🔑 **PIN Security**
> - Use random 6-digit PINs — avoid `123456`, birthdays, or patterns
> - Share the PIN through a **separate secure channel** (voice call, encrypted messenger)
> - Use different PINs for different files

> 🖼️ **Key Image Safety**
> - The key image contains your encryption key (hidden via steganography)
> - Never re-compress, convert to JPEG, or edit the image — this destroys the hidden data
> - Store securely and back up alongside the encrypted file

📖 **Full security documentation** → [docs/security.md](docs/security.md)

---

## 🌐 Browser Compatibility

| Browser | Minimum Version | Status |
|:--------|:----------------|:------:|
| Chrome / Edge | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Opera | 76+ | ✅ |

**Requires**: Web Crypto API • Canvas API • File API • ES6 Modules • HTTPS or localhost

---

## 🎨 Image Generation

The key image is generated using one of **six procedural art algorithms**, randomly selected:

| # | Algorithm | Description |
|:-:|:----------|:------------|
| 1 | **Voronoi Diagrams** | Colorful cellular patterns |
| 2 | **Concentric Circles** | Hypnotic radial designs |
| 3 | **Flow Fields** | Organic flowing curves |
| 4 | **Random Polygons** | Geometric abstract art |
| 5 | **Wave Interference** | Mathematical wave patterns |
| 6 | **Circle Packing** | Densely packed circle compositions |

Each image is **1200×1200 pixels**, PNG format, and **unique** — seeded with timestamp + random values. The abstract patterns naturally mask the steganographic modifications.

---

## 🧪 Testing

### Manual Testing Checklist

- [x] Encrypt/decrypt 1KB, 100MB, and 1GB files
- [x] Test with PDF, images, videos, and archives
- [x] Verify wrong PIN fails decryption gracefully
- [x] Verify tampered image fails with integrity error
- [x] Test on iOS Safari and Android Chrome
- [x] Full keyboard navigation audit
- [x] Screen reader compatibility verified
- [x] ZIP download produces valid archive

### Performance Benchmarks

| Operation | Speed | Notes |
|:----------|:------|:------|
| Encryption | ~50–100 MB/s | Varies by device |
| Image Generation | < 2s | 1200×1200 canvas |
| Steganography Embed | < 1s | 96 bytes into PNG |
| Steganography Extract | < 1s | Single-pass algorithm |
| ZIP Creation | < 1s | Pure JS implementation |

---

## 🚀 Deployment

### GitHub Pages (Recommended)

```bash
# 1. Fork or clone
git clone https://github.com/Ns81000/SecureStego.git
cd SecureStego

# 2. Push to your GitHub
git remote set-url origin https://github.com/YOUR_USERNAME/SecureStego.git
git push -u origin main

# 3. Enable GitHub Pages
#    Settings → Pages → Source: main branch → Save

# 4. Prevent Jekyll processing
touch .nojekyll
git add .nojekyll && git commit -m "Add .nojekyll" && git push
```

Your app will be live at `https://YOUR_USERNAME.github.io/SecureStego/`

### Custom Domain

1. Add a `CNAME` file with your domain
2. Configure DNS: `CNAME` record → `YOUR_USERNAME.github.io`
3. HTTPS is automatically provisioned via GitHub Pages

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# 1. Fork the repo on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/SecureStego.git

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make changes and test locally

# 5. Commit with a descriptive message
git commit -m "feat: add batch file encryption"

# 6. Push and open a PR
git push origin feature/amazing-feature
```

Then open a **[Pull Request](https://github.com/Ns81000/SecureStego/pulls)** on GitHub.

### Contribution Guidelines

- Keep it vanilla — no external dependencies
- Follow existing code style and naming conventions
- Test on at least Chrome and Firefox
- Update documentation if adding features

---

## 🔮 Roadmap

- [x] ~~ZIP archive download option~~ ✅ Shipped
- [ ] Batch file encryption
- [ ] Custom image upload (instead of generated art)
- [ ] Encryption strength indicator
- [ ] Multi-language support (i18n)
- [ ] Offline PWA mode with service worker
- [ ] File compression before encryption
- [ ] Drag-and-drop between encrypt/decrypt tabs

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — Copyright (c) 2026 SecureStego Vault
```

---

## 📞 Support

| Channel | Link |
|:--------|:-----|
| 🐛 Bug Reports | [GitHub Issues](https://github.com/Ns81000/SecureStego/issues) |
| 💬 Discussions | [GitHub Discussions](https://github.com/Ns81000/SecureStego/discussions) |
| 🔐 Security Issues | Report privately via [GitHub Security](https://github.com/Ns81000/SecureStego/security) |

---

## 🙏 Acknowledgments

- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)** — Browser-native cryptographic primitives
- **[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** — Image generation and pixel manipulation
- **Modern Web Standards** — Making secure, dependency-free apps possible

---

## ⚠️ Disclaimer

This software is provided "as is" without warranty. While it uses industry-standard cryptography (NIST-approved algorithms), no encryption is 100% unbreakable. Use at your own risk. Always keep backups of important files before encrypting.

---

<p align="center">
  Made with ❤️ for privacy and security<br/><br/>
  <a href="https://github.com/Ns81000/SecureStego">
    <img src="https://img.shields.io/badge/⭐_Star_this_repo-a855f7?style=for-the-badge" alt="Star this repo" />
  </a>
</p>
