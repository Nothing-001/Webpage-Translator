from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
import logging
import pytesseract
from PIL import Image
import io

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
CORS(app)

# Helper function to validate text


def is_valid_text(text):
    return isinstance(text, str) and len(text.strip()) > 0


# OCR endpoint: extract text from uploaded image file
@app.route("/extract_image_text", methods=["POST"])
def extract_image_text():
    if 'image' not in request.files:
        logging.error("[OCR ERROR] No image file provided in request.files.")
        return jsonify({"error": "No image file provided."}), 400
    import tempfile, os
    image_file = request.files['image']
    try:
        # Log file info
        logging.info(f"[OCR] Received file: filename={image_file.filename}, content_type={image_file.content_type}, content_length={image_file.content_length}")
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
            image_file.save(tmp)
            tmp_path = tmp.name
        try:
            image = Image.open(tmp_path)
        except Exception as img_err:
            logging.error(f"[OCR ERROR] Failed to open image: {img_err}")
            os.remove(tmp_path)
            return jsonify({"error": "Invalid or unsupported image format."}), 400
        text = pytesseract.image_to_string(image)
        os.remove(tmp_path)
        if not is_valid_text(text):
            logging.warning("[OCR] No valid text found in the image.")
            return jsonify({"error": "No valid text found in the image."}), 400
        return jsonify({"text": text})
    except Exception as e:
        logging.error(f"[OCR ERROR] {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/translate_texts", methods=["POST"])
def translate_texts():
    data = request.get_json()
    texts = data.get("texts", [])
    src = data.get("src", "auto")
    tgt = data.get("tgt", "en")

    if not isinstance(texts, list):
        logging.error("[SERVER ERROR] 'texts' must be a list.")
        return jsonify({"error": "Invalid input: 'texts' must be a list."}), 400

    logging.info(f"[SERVER] Received {len(texts)} texts for translation {src}→{tgt}")

    # Ensure the total length of texts does not exceed 5000 characters
    total_length = sum(len(text) for text in texts if is_valid_text(text))
    if total_length > 5000:
        logging.warning(f"[SERVER WARNING] Total text length ({total_length}) exceeds 5000 characters. Splitting into smaller chunks.")

    try:
        translated = []
        current_chunk = []
        current_length = 0

        for text in texts:
            if not is_valid_text(text):
                logging.warning(f"[TRANSLATE] Skipping invalid text: {text}")
                translated.append(text)
                continue

            if current_length + len(text) > 5000:
                # Process the current chunk
                chunk_translations = [GoogleTranslator(source=src, target=tgt).translate(t) for t in current_chunk]
                translated.extend(chunk_translations)
                current_chunk = []
                current_length = 0

            current_chunk.append(text)
            current_length += len(text)

        # Process the last chunk
        if current_chunk:
            chunk_translations = [GoogleTranslator(source=src, target=tgt).translate(t) for t in current_chunk]
            translated.extend(chunk_translations)

        logging.info(f"[SERVER] Successfully translated {len(translated)} texts.")
        return jsonify({"translated": translated})
    except Exception as e:
        logging.error(f"[SERVER ERROR] {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
