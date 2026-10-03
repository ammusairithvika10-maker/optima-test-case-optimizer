import sqlite3

DB_NAME = "optima.db"


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def create_table():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS test_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            topic TEXT NOT NULL,
            edge_case TEXT NOT NULL,
            execution_time INTEGER NOT NULL,
            priority INTEGER NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def get_all_test_cases():
    conn = get_connection()

    rows = conn.execute("""
        SELECT
            id,
            name,
            topic,
            edge_case,
            execution_time,
            priority
        FROM test_cases
        ORDER BY id
    """).fetchall()

    conn.close()

    return [dict(row) for row in rows]


def add_test_case(
    name,
    topic,
    edge_case,
    execution_time,
    priority
):
    conn = get_connection()

    cursor = conn.execute("""
        INSERT INTO test_cases
        (name, topic, edge_case, execution_time, priority)
        VALUES (?, ?, ?, ?, ?)
    """, (
        name,
        topic,
        edge_case,
        execution_time,
        priority
    ))

    conn.commit()

    new_id = cursor.lastrowid

    conn.close()

    return new_id


def delete_test_case(case_id):
    conn = get_connection()

    conn.execute(
        "DELETE FROM test_cases WHERE id = ?",
        (case_id,)
    )

    conn.commit()
    conn.close()