"""
PathAI – Database Initialisation & Dummy Data
In-memory SQLite database for the prototype
"""

import sqlite3
import os

DB_PATH = "pathai.db"

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

import hashlib
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    # Delete existing DB if needed
    # if os.path.exists(DB_PATH):
    #     os.remove(DB_PATH)

    conn = get_db()
    cursor = conn.cursor()

    # Create Resources table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        rating REAL,
        duration TEXT,
        free BOOLEAN,
        level TEXT,
        tags TEXT, -- Comma-separated
        url TEXT,
        description TEXT
    )
    ''')

    # Check if we already have data
    cursor.execute('SELECT COUNT(*) FROM resources')
    if cursor.fetchone()[0] == 0:
        # Seed dummy data
        resources = [
            ('Machine Learning by Andrew Ng', 'course', 'Coursera', 4.9, '60hrs', 0, 'beginner', 'ai-ml,data-science', '#', 'A world-class introduction to ML.'),
            ('Python for Data Science', 'course', 'edX', 4.7, '40hrs', 1, 'beginner', 'data-science,ai-ml', '#', 'Learn Python for data analysis.'),
            ('React Full-Stack Tutorial', 'tutorial', 'freeCodeCamp', 4.8, '20hrs', 1, 'intermediate', 'web-dev', '#', 'Build full-stack apps with React.'),
            ('Deep Learning Specialization', 'course', 'Coursera', 4.9, '80hrs', 0, 'advanced', 'ai-ml', '#', 'Master deep learning.'),
            ('Kubernetes Full Course', 'video', 'YouTube', 4.6, '8hrs', 1, 'intermediate', 'devops,cloud', '#', 'Learn container orchestration.'),
            ('UI/UX Design Fundamentals', 'course', 'Udemy', 4.7, '30hrs', 0, 'beginner', 'design', '#', 'Master the basics of design.'),
            ('Ethereum Solidity Development', 'tutorial', 'CryptoZombies', 4.5, '15hrs', 1, 'intermediate', 'blockchain', '#', 'Learn smart contract development.'),
            ('CompTIA Security+ Prep', 'course', 'Udemy', 4.8, '50hrs', 0, 'intermediate', 'cybersecurity', '#', 'Study for the Security+ exam.'),
            ('Flutter & Dart Bootcamp', 'course', 'Udemy', 4.7, '35hrs', 0, 'beginner', 'mobile', '#', 'Build mobile apps for iOS and Android.'),
            ('AWS Certified Solutions Arch.', 'course', 'A Cloud Guru', 4.8, '45hrs', 0, 'intermediate', 'cloud', '#', 'Become a certified AWS architect.'),
            ('CSS in 2024 — Grid & Flexbox', 'tutorial', 'CSS-Tricks', 4.6, '5hrs', 1, 'beginner', 'web-dev,design', '#', 'Modern CSS layout techniques.'),
            ('Natural Language Processing', 'course', 'Fast.ai', 4.9, '55hrs', 1, 'advanced', 'ai-ml', '#', 'NLP with deep learning.'),
            ('Docker for Developers', 'video', 'YouTube', 4.5, '6hrs', 1, 'beginner', 'devops', '#', 'Containerize your applications.'),
            ('TensorFlow Developer Guide', 'doc', 'TensorFlow.org', 4.7, 'Self-paced', 1, 'intermediate', 'ai-ml', '#', 'Official TF documentation.'),
            ('Data Structures & Algorithms', 'course', 'LeetCode', 4.8, '40hrs', 0, 'intermediate', 'web-dev,data-science', '#', 'Cracking the coding interview.'),
        ]
        cursor.executemany('''
        INSERT INTO resources (title, type, source, rating, duration, free, level, tags, url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', resources)

    # Create User Progress table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT PRIMARY KEY,
        hours_learned REAL,
        courses_completed INTEGER,
        streak_days INTEGER,
        points INTEGER
    )
    ''')

    # Create Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Seed one user
    cursor.execute('SELECT COUNT(*) FROM user_progress WHERE user_id = "user_001"')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO user_progress VALUES ("user_001", 0.0, 0, 0, 0)')
        # Add corresponding user to users table
        cursor.execute('INSERT INTO users (user_id, username, email, password_hash) VALUES ("user_001", "demo_user", "demo@example.com", ?)', (hash_password("password123"),))

    conn.commit()
    conn.close()
