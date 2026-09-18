from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from app.agent import BuildFailureAgent, BuildAnalysisRequest, BuildAnalysisResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("devpulse.ai_service")

app = FastAPI(
    title="DevPulse AI Build Analyzer",
    description="Microservice providing AI build failure diagnostic reports",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = BuildFailureAgent()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "devpulse-ai-service",
        "engine": "tool-agent-hybrid"
    }

@app.post("/analyze-build", response_model=BuildAnalysisResponse)
def analyze_build(request: BuildAnalysisRequest):
    logger.info(f"Received build analysis request for commit {request.commitHash} (Status: {request.status})")
    
    if request.status.lower() != "failed":
        raise HTTPException(status_code=400, detail="Only failed builds can be analyzed.")
        
    try:
        analysis = agent.analyze(request)
        return analysis
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Build Analysis Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
