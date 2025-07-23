document.getElementById("translateBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const src = document.getElementById("src").value || "auto";
  const tgt = document.getElementById("tgt").value || "en";

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (srcLang, tgtLang) => {
      window.postMessage({ type: "DO_TRANSLATE", src: srcLang, tgt: tgtLang }, "*");
    },
    args: [src, tgt]
  });
});
