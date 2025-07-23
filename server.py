from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
CORS(app)

@app.route("/translate_texts", methods=["POST"])
def translate_texts():
    data = request.get_json()
    texts = data.get("texts", [])
    src = data.get("src", "auto")
    tgt = data.get("tgt", "en")

    logging.info(f"[SERVER] Translating {len(texts)} texts {src}→{tgt}")
    try:
        translated = []
        for text in texts:
            try:
                translated_text = GoogleTranslator(source=src, target=tgt).translate(text)
                translated.append(translated_text)
            except Exception as e:
                logging.warning(f"[TRANSLATE] Fallback or skip: {e}")
                translated.append(text)
        return jsonify({"translated": translated})
    except Exception as e:
        logging.error(f"[SERVER ERROR] {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
