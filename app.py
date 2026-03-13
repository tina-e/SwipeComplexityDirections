from flask import Flask, request, jsonify, render_template
import csv
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")


# @app.route("/log", methods=["POST"])
# def log_data():
#     data = request.json

#     with open(CSV_FILE, "a", newline="") as f:
#         writer = csv.writer(f)
#         writer.writerow([data["name"], data["value"]])

#     return jsonify({"status": "ok"})


@app.route("/log", methods=["POST"])
def log_data():
    data = request.json
    
    user_id = data.get("pid")
    filename = f"data/data_{user_id}.csv"
    file_exists = os.path.isfile(filename)

    with open(filename, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=data.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(data)
    return jsonify({"status": "ok"})


# @app.route("/touchlog", methods=["POST"])
# def log_data():
#     # data = request.json

#     # with open(CSV_FILE, "a", newline="") as f:
#     #     writer = csv.writer(f)
#     #     writer.writerow([data["name"], data["value"]])

#     # return jsonify({"status": "ok"})


if __name__ == "__main__":
    # app.run(debug=True)
    app.run(host="0.0.0.0", port=5000, debug=True)