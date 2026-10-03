from flask import Flask, request, jsonify
from flask_cors import CORS

from database import (
    create_table,
    get_all_test_cases,
    add_test_case,
    delete_test_case
)


app = Flask(__name__)

CORS(app)

create_table()


@app.route("/")
def home():
    return jsonify({
        "message": "OPTIMA Backend is running",
        "status": "online"
    })


@app.route("/api/test-cases", methods=["GET"])
def get_test_cases():

    test_cases = get_all_test_cases()

    return jsonify(test_cases)


@app.route("/api/test-cases", methods=["POST"])
def create_test_case():

    data = request.get_json(silent=True) or {}

    name = data.get("name")
    topic = data.get("topic")
    edge_case = data.get("edgeCase", "No")
    execution_time = data.get("time")
    priority = data.get("priority")

    if not name or not topic:
        return jsonify({
            "error": "Name and topic are required"
        }), 400

    if execution_time is None or priority is None:
        return jsonify({
            "error": "Time and priority are required"
        }), 400

    try:
        execution_time = int(execution_time)
        priority = int(priority)

    except ValueError:
        return jsonify({
            "error": "Time and priority must be numbers"
        }), 400

    new_id = add_test_case(
        name,
        topic,
        edge_case,
        execution_time,
        priority
    )

    return jsonify({
        "message": "Test case added successfully",
        "id": new_id
    }), 201


@app.route("/api/test-cases/<int:case_id>", methods=["DELETE"])
def remove_test_case(case_id):

    delete_test_case(case_id)

    return jsonify({
        "message": "Test case deleted successfully"
    })


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )