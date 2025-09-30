from flask import Flask, render_template
from markupsafe import escape

app = Flask(__name__)

# Route untuk landing page
@app.route('/')
def index():
    return render_template('index.html')