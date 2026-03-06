"""
PathAI – Pydantic Models & Schemas
All request/response models for the API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────
class SkillLevel(str, Enum):
    beginner     = "beginner"
    intermediate = "intermediate"
    advanced     = "advanced"


class ResourceType(str, Enum):
    course   = "course"
    video    = "video"
    tutorial = "tutorial"
    doc      = "doc"
    book     = "book"


class PathStatus(str, Enum):
    active    = "active"
    paused    = "paused"
    completed = "completed"


# ─── Request Models ────────────────────────────────────────────────
class PathGenerationRequest(BaseModel):
    goals:      List[str]       = Field(..., description="User's learning goals e.g. ['career-change']")
    topics:     List[str]       = Field(..., description="Topic tags e.g. ['ai-ml','web-dev']")
    skill:      SkillLevel      = Field(SkillLevel.beginner, description="Current skill level")
    time:       str             = Field("3-5", description="Weekly hours available e.g. '3-5'")
    user_id:    Optional[str]   = Field(None, description="Optional user ID for personalisation")

    class Config:
        schema_extra = {
            "example": {
                "goals":   ["career-change", "skill-upgrade"],
                "topics":  ["ai-ml"],
                "skill":   "beginner",
                "time":    "6-10",
                "user_id": "user_001"
            }
        }


class SearchRequest(BaseModel):
    query:      str             = Field("", description="Search query")
    resource_type: Optional[str] = Field(None, description="Filter by type")
    skill:      Optional[str]   = Field(None)
    free_only:  bool            = Field(False)
    topic:      Optional[str]   = Field(None)
    page:       int             = Field(1, ge=1)
    per_page:   int             = Field(12, ge=1, le=50)


class ProgressUpdateRequest(BaseModel):
    user_id:    str
    path_id:    str
    phase_idx:  int             = Field(..., ge=0)
    resource_id: Optional[int] = None
    completed:  bool            = Field(True)
    rating:     Optional[int]   = Field(None, ge=1, le=5)
    feedback:   Optional[str]   = None


class SavePathRequest(BaseModel):
    user_id:    str
    path_id:    str
    title:      str
    emoji:      str
    topic:      str
    skill:      str


class FeedbackRequest(BaseModel):
    user_id:      str
    resource_id:  int
    helpful:      bool
    comment:      Optional[str] = None


# ─── Response Models ───────────────────────────────────────────────
class ResourceOut(BaseModel):
    id:         int
    title:      str
    type:       str
    source:     str
    rating:     float
    duration:   str
    free:       bool
    level:      str
    tags:       List[str]
    url:        str
    description: str
    match_score: Optional[float] = None


class PhaseOut(BaseModel):
    num:         int
    title:       str
    desc:        str
    topics:      List[str]
    resources:   List[ResourceOut]
    duration_weeks: int
    progress:    float = 0.0


class LearningPathOut(BaseModel):
    path_id:    str
    title:      str
    emoji:      str
    desc:       str
    total_weeks: int
    color:      str
    phases:     List[PhaseOut]
    recommended_resources: List[ResourceOut]
    estimated_hours: int
    certificates: int
    skill_level: str
    why_this_path: List[str]


class ProgressOut(BaseModel):
    user_id:          str
    hours_learned:    float
    courses_completed: int
    streak_days:      int
    points:           int
    level:            str
    weekly_activity:  List[Dict[str, Any]]
    topic_distribution: List[Dict[str, Any]]
    achievements:     List[Dict[str, Any]]
    active_paths:     List[Dict[str, Any]]


# ─── Auth Models ──────────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str


class UserOut(BaseModel):
    user_id: str
    username: str
    email: str
    created_at: Optional[str] = None
