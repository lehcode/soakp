from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route('/gen/jsonl', methods=['POST'])
def run_script():
    subprocess.run(["python", "your_script.py"])
    return 'Script executed'

@app.route('/jsonl/convert', methods=['POST'])
def upload_and_convert():
    file = request.files['file']
    data = file.read()
    # Now 'data' contains the data from the Buffer object sent by the Node.js server
    # You can process the data as needed
    return 'File received.'

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000)
