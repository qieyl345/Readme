from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/analyze", tags=["Security"])

class LoginAnalysisRequest(BaseModel):
    user_id: str
    ip_address: str
    timestamp: str
    user_agent: Optional[str] = None

class LoginAnalysisResponse(BaseModel):
    is_suspicious: bool
    confidence: float
    risk_factors: list[str]
    status: str

@router.post("/login", response_model=LoginAnalysisResponse)
async def analyze_login(request: LoginAnalysisRequest):
    """
    Analyze login metadata for suspicious patterns.
    """
    risk_score = 0.0
    risk_factors = []
    
    # 1. Check time (Suspicious if late night, e.g., 2 AM - 5 AM)
    try:
        # Simple ISO parse (adjust based on format if needed)
        # Replace 'Z' to handle UTC timestamps correctly in standard isoformat
        dt = datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
        if 2 <= dt.hour <= 5:
            risk_score += 0.3
            risk_factors.append("Unusual login time (Late Night)")
    except Exception:
        pass 

    # 2. Check IP (Simple simulation)
    # In a real app, we would use a GeoIP database here.
    # For this challenge, we flag anything that isn't localhost.
    if request.ip_address not in ["127.0.0.1", "::1", "localhost"]:
        risk_score += 0.1
        # risk_factors.append("External IP")

    # 3. User Agent Check (Bot detection)
    if not request.user_agent or "curl" in request.user_agent.lower() or "postman" in request.user_agent.lower():
        risk_score += 0.5
        risk_factors.append("Suspicious User Agent (Bot/Tool)")

    # Final Decision
    # If risk score is high enough, flag as suspicious
    is_suspicious = risk_score > 0.4
    
    return {
        "is_suspicious": is_suspicious,
        "confidence": min(risk_score, 1.0),
        "risk_factors": risk_factors,
        "status": "success"
    }

