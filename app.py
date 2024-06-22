from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
import tensorflow as tf
import pandas as pd

# Flask uygulamasını başlat
app = Flask(__name__)

CORS(app)

# Modeli yükle
model = load_model('model.h5')

# Veri setini yükle
df = pd.read_csv('veriseti.csv')

from tensorflow.keras.layers import TextVectorization

# Metin vektörleştirme katmanını tanımla
X = df['COMMENT']
y = df[df.columns[1:]].values

MAX_FEATURES = 200000  # number of words in the vocab

def custom_standardization(input_text):
    input_text = tf.strings.lower(input_text)
    input_text = tf.strings.regex_replace(input_text, '[^a-zA-Z0-9 ]', '')
    return input_text

vectorizer = TextVectorization(max_tokens=MAX_FEATURES,
                               output_sequence_length=1800,
                               output_mode='int',
                               standardize=custom_standardization)

vectorizer.adapt(X.values)
vectorized_text = vectorizer(X.values)



# API endpoint'i tanımla
@app.route('/classify', methods=['POST'])
def classify_text():
    # Gelen isteği JSON formatında al
    data = request.get_json()
    
    # Metin verisini al
    text = data['text']
    
    # Metni vektörleştir
    vectorized_text = vectorizer([text])
    
    # Modelden tahmin yap
    prediction = model.predict(vectorized_text)
    
    # Tahmin sonuçlarını anlamlandır ve sınıflandır
    text = ''
    for idx, col in enumerate(df.columns[1:]):
        text += '{}: {} '.format(col, prediction[0][idx] > 0.5)
    
    # Sonucu ve tahmin olasılıklarını JSON formatında döndür
    return jsonify({
        'prediction': text
    })

if __name__ == '__main__':
    # Uygulamayı çalıştır
    app.run(debug=True)
