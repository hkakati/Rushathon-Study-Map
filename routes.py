"""
PathAI – API Routes
Handles path generation, resource searching, and progress updates
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from models import (
    PathGenerationRequest, LearningPathOut, PhaseOut, ResourceOut,
    SearchRequest, ProgressUpdateRequest, ProgressOut, SavePathRequest,
    UserRegister, UserLogin, Token, UserOut
)
from database import get_db, hash_password
import sqlite3
import uuid

router = APIRouter()

# ─── PATH TEMPLATES (Simplified for dynamic backend logic) ─────────────
PATH_TEMPLATES = {
    'ai-ml': {
        'title': 'AI & Machine Learning Mastery',
        'emoji': '🤖',
        'desc': 'A curated journey from Python basics to deploying production ML models',
        'weeks': 16,
        'color': 'linear-gradient(90deg,#6366f1,#22d3ee)',
        'phases': [
            {'num': 1, 'title': 'Python & Math Foundations', 'desc': 'NumPy, Pandas, Statistics, Linear Algebra', 'topics': ['Python', 'Statistics', 'Linear Algebra', 'NumPy'], 'duration': 4},
            {'num': 2, 'title': 'Classical Machine Learning', 'desc': 'Supervised and unsupervised learning algorithms', 'topics': ['Regression', 'Classification', 'Clustering', 'SVM'], 'duration': 4},
            {'num': 3, 'title': 'Deep Learning & Neural Networks', 'desc': 'CNNs, RNNs, Transformers, and Transfer Learning', 'topics': ['TensorFlow', 'PyTorch', 'CNNs', 'Transformers'], 'duration': 4},
            {'num': 4, 'title': 'MLOps & Deployment', 'desc': 'Model serving, monitoring, and production pipelines', 'topics': ['Docker', 'FastAPI', 'MLflow', 'Kubernetes'], 'duration': 4},
        ]
    },
    'web-dev': {
        'title': 'Full-Stack Web Developer',
        'emoji': '🌐',
        'desc': 'Build modern web apps from scratch — HTML to cloud deployment',
        'weeks': 14,
        'color': 'linear-gradient(90deg,#f472b6,#fb923c)',
        'phases': [
            {'num': 1, 'title': 'HTML, CSS & JavaScript', 'desc': 'Core building blocks of the web', 'topics': ['HTML5', 'CSS3', 'JavaScript ES6+', 'DOM'], 'duration': 3},
            {'num': 2, 'title': 'React & Modern Frontend', 'desc': 'Component-based UI with state management', 'topics': ['React', 'Redux', 'TypeScript', 'Vite'], 'duration': 4},
            {'num': 3, 'title': 'Backend & APIs', 'desc': 'Node.js, REST APIs, databases, authentication', 'topics': ['Node.js', 'Express', 'MongoDB', 'JWT'], 'duration': 4},
            {'num': 4, 'title': 'DevOps & Deployment', 'desc': 'CI/CD, Docker, Nginx, cloud providers', 'topics': ['Git', 'Docker', 'AWS', 'Vercel'], 'duration': 3},
        ]
    }
    # Add more as needed...
}

@router.post("/generate", response_model=LearningPathOut)
def generate_path(req: PathGenerationRequest):
    topic_key = req.topics[0] if req.topics else 'ai-ml'
    tpl = PATH_TEMPLATES.get(topic_key, PATH_TEMPLATES['ai-ml'])

    # Query matching resources from database
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM resources WHERE tags LIKE ?', (f'%{topic_key}%',))
    matched_resources = [dict(row) for row in cursor.fetchall()]
    
    # Process rows for response
    def format_resource(r):
        return ResourceOut(
            id=r['id'],
            title=r['title'],
            type=r['type'],
            source=r['source'],
            rating=r['rating'],
            duration=r['duration'],
            free=bool(r['free']),
            level=r['level'],
            tags=r['tags'].split(','),
            url=r['url'],
            description=r['description']
        )

    res_out = [format_resource(r) for r in matched_resources]

    # Map phases
    phases = []
    for p in tpl['phases']:
        phases.append(PhaseOut(
            num=p['num'],
            title=p['title'],
            desc=p['desc'],
            topics=p['topics'],
            resources=res_out[:1], # Simplified: just pick one for each phase
            duration_weeks=p['duration'],
            progress=0.0
        ))

    db.close()

    return LearningPathOut(
        path_id=f"path_{topic_key}_{req.skill}",
        title=tpl['title'],
        emoji=tpl['emoji'],
        desc=tpl['desc'],
        total_weeks=tpl['weeks'],
        color=tpl['color'],
        phases=phases,
        recommended_resources=res_out[:6],
        estimated_hours=tpl['weeks'] * 5,
        certificates=3,
        skill_level=req.skill,
        why_this_path=[f"Tailored for {req.skill} level", f"Optimized for {req.time} hrs/week commitment"]
    )

@router.get("/progress/{user_id}", response_model=ProgressOut)
def get_progress(user_id: str):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM user_progress WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()
    db.close()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return ProgressOut(
        user_id=user_id,
        hours_learned=row['hours_learned'],
        courses_completed=row['courses_completed'],
        streak_days=row['streak_days'],
        points=row['points'],
        level="Novice",
        weekly_activity=[{'label': 'Mon', 'hrs': 1.5}, {'label': 'Tue', 'hrs': 0}],
        topic_distribution=[{'label': 'AI/ML', 'pct': 75}, {'label': 'Web Dev', 'pct': 25}],
        achievements=[{'icon': '🚀', 'name': 'First Step', 'desc': 'Completed setup', 'locked': False}],
        active_paths=[]
    )

@router.get("/resources", response_model=List[ResourceOut])
def list_resources(topic: str = None):
    db = get_db()
    cursor = db.cursor()
    if topic:
        cursor.execute('SELECT * FROM resources WHERE tags LIKE ?', (f'%{topic}%',))
    else:
        cursor.execute('SELECT * FROM resources')
    
    rows = cursor.fetchall()
    db.close()

    return [
        ResourceOut(
            id=r['id'],
            title=r['title'],
            type=r['type'],
            source=r['source'],
            rating=r['rating'],
            duration=r['duration'],
            free=bool(r['free']),
            level=r['level'],
            tags=r['tags'].split(','),
            url=r['url'],
            description=r['description']
        ) for r in rows
    ]

# ─── Auth Routes ──────────────────────────────────────────────────
@router.post("/auth/signup", response_model=UserOut)
def signup(req: UserRegister):
    db = get_db()
    cursor = db.cursor()
    
    # Check if username exists
    cursor.execute('SELECT * FROM users WHERE username = ? OR email = ?', (req.username, req.email))
    if cursor.fetchone():
        db.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user_id = f"user_{uuid.uuid4().hex[:8]}"
    pwd_hash = hash_password(req.password)
    
    try:
        cursor.execute('''
            INSERT INTO users (user_id, username, email, password_hash)
            VALUES (?, ?, ?, ?)
        ''', (user_id, req.username, req.email, pwd_hash))
        
        # Initialize progress for new user
        cursor.execute('INSERT INTO user_progress VALUES (?, 0.0, 0, 0, 0)', (user_id,))
        
        db.commit()
        db.close()
        return UserOut(user_id=user_id, username=req.username, email=req.email)
    except Exception as e:
        db.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login", response_model=Token)
def login(req: UserLogin):
    db = get_db()
    cursor = db.cursor()
    pwd_hash = hash_password(req.password)
    
    cursor.execute('SELECT * FROM users WHERE username = ? AND password_hash = ?', (req.username, pwd_hash))
    row = cursor.fetchone()
    db.close()
    
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return Token(
        access_token=f"fake-jwt-token-{row['user_id']}",
        token_type="bearer",
        user_id=row['user_id'],
        username=row['username']
    )
