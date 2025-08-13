function splitTextsIntoChunks(texts, maxLength) {
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const text of texts) {
    if (currentLength + text.length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentLength = 0;
    }
    currentChunk.push(text);
    currentLength += text.length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

window.addEventListener("message", async (event) => {
  if (event.data.type !== "DO_TRANSLATE") return;

  const src = event.data.src;
  const tgt = event.data.tgt;

  // Handle text nodes
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim().length > 1) {
      textNodes.push(node);
    }
  }

  const texts = textNodes.map(n => n.textContent);
  const textChunks = splitTextsIntoChunks(texts, 5000);
  const translatedTexts = [];

  for (const chunk of textChunks) {
    const response = await fetch("http://127.0.0.1:5000/translate_texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: chunk, src, tgt })
    });

    const result = await response.json();
    if (result.translated) {
      translatedTexts.push(...result.translated);
    }
  }

  // Overlay translated text directly on top of original text nodes
  translatedTexts.forEach((text, i) => {
    const node = textNodes[i];
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.textContent = text;
    overlay.style.position = 'absolute';
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.background = 'rgba(255,255,255,0.7)';
    overlay.style.color = 'black';
    overlay.style.fontSize = window.getComputedStyle(node.parentElement).fontSize;
    overlay.style.fontWeight = 'bold';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.textAlign = 'center';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = 9999;
    overlay.className = 'ocr-translation-overlay';
    document.body.appendChild(overlay);
  });

  // Handle images
  const images = Array.from(document.images);
  for (const img of images) {
    try {
      // Only process if image is loaded and accessible
      if (!img.complete || img.naturalWidth === 0) continue;
      const imgUrl = img.src;
      // Fetch the image as a blob and convert to File
      const response = await fetch(imgUrl, { mode: 'cors' });
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) continue;
      // Set filename extension based on blob type
      let ext = 'png';
      if (blob.type.endsWith('jpeg')) ext = 'jpg';
      else if (blob.type.endsWith('gif')) ext = 'gif';
      else if (blob.type.endsWith('bmp')) ext = 'bmp';
      else if (blob.type.endsWith('webp')) ext = 'webp';
      // Convert blob to File for FormData
      const file = new File([blob], `image.${ext}`, { type: blob.type });
      const formData = new FormData();
      formData.append('image', file);

      const ocrResp = await fetch("http://127.0.0.1:5000/extract_image_text", {
        method: "POST",
        body: formData
      });
      const ocrResult = await ocrResp.json();
      if (!ocrResult.text || ocrResult.text.trim().length < 1) continue;

      const transResp = await fetch("http://127.0.0.1:5000/translate_texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [ocrResult.text], src, tgt })
      });
      const transResult = await transResp.json();
      const translatedText = (transResult.translated && transResult.translated[0]) ? transResult.translated[0] : null;
      if (!translatedText) continue;

      // Overlay translated text directly on top of the image
      const rect = img.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.textContent = translatedText;
      overlay.style.position = 'absolute';
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.background = 'rgba(255,255,255,0.7)';
      overlay.style.color = 'black';
      overlay.style.fontSize = '1.2em';
      overlay.style.fontWeight = 'bold';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.textAlign = 'center';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = 9999;
      overlay.className = 'ocr-translation-overlay';
      document.body.appendChild(overlay);
    } catch (e) {
      continue;
    }
  }

  // Handle SVGs
  const svgs = Array.from(document.querySelectorAll('svg'));
  for (const svg of svgs) {
    const textElements = Array.from(svg.querySelectorAll('text, tspan'));
    const svgTexts = textElements.map(el => el.textContent);

    const svgResponse = await fetch("http://127.0.0.1:5000/translate_texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: svgTexts, src, tgt })
    });

    const svgResult = await svgResponse.json();
    if (svgResult.translated) {
      svgResult.translated.forEach((text, i) => {
        textElements[i].textContent = text;
      });
    }
  }
});
