window.addEventListener("message", async (event) => {
  if (event.data.type !== "DO_TRANSLATE") return;

  const src = event.data.src;
  const tgt = event.data.tgt;

  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim().length > 1) {
      textNodes.push(node);
    }
  }

  const texts = textNodes.map(n => n.textContent);
  const response = await fetch("http://127.0.0.1:5000/translate_texts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, src, tgt })
  });

  const result = await response.json();
  if (result.translated) {
    result.translated.forEach((text, i) => {
      textNodes[i].textContent = text;
    });
  }
});
