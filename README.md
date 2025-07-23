# Webpage Translator Extension (with OCR Support)

This is a Chrome extension + Python backend that:

- Translates webpage **text content**
- Translates **text inside images using OCR**
- **Preserves** original layout and images
- Overlays **translated text on top of images**
- Lets you choose source and target languages
- Works on Windows with a simple Flask server

---

## 🚀 How to Use

### 1. Start the Flask Server

In your project folder:

```bash
python server.py
```

This starts the translation backend on:\
`http://127.0.0.1:5000`

---

### 2. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project

---

### 3. Translate Any Webpage

1. Open any non-Chrome-internal webpage (e.g. `https://example.com`)
2. Click the extension icon
3. Choose source and target language (e.g. auto → en)
4. Click **"Translate Page"**


## 🧪 Dependencies

Install Python requirements using:

```bash
pip install -r requirements.txt
```

---

## ✅ Features

- Full-page text translation
- OCR for image-based comics (e.g., manhwa/manga)
- Language toggle (source and target)
- Translated text overlays on top of original images

---

## 📌 Notes

- Server must be running for the extension to work.
- Works best on publicly accessible websites (not behind login).
- OCR is optimized for simple comic fonts but not handwritten styles.

---

## 📋 License

No license. This is a personal project.
