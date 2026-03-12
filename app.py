from flask import Flask, request, jsonify, render_template
import csv
import os

app = Flask(__name__)

CSV_FILE = "data.csv"

# create csv if it doesn't exist
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "value"])

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/log", methods=["POST"])
def log_data():
    data = request.json

    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([data["name"], data["value"]])

    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)