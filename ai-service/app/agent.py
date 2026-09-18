"""
AI Build Failure Agent for DevPulse.
Combines tool analysis with LLM structured diagnostics or deterministic pattern parsing.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.tools import LogAnalysisTools

logger = logging.getLogger("devpulse.agent")

class BuildAnalysisRequest(BaseModel):
    buildId: Optional[str] = None
    commitHash: str
    branch: str
    status: str
    logs: str
    changedFiles: Optional[List[str]] = []

class BuildAnalysisResponse(BaseModel):
    rootCause: str
    explanation: str
    affectedArea: str
    suggestedFix: str
    confidence: str
    limitations: str

class BuildFailureAgent:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def analyze(self, request: BuildAnalysisRequest) -> BuildAnalysisResponse:
        """Executes tool log gathering first, then performs structured failure analysis."""
        # 1. Tool-based log inspection
        tool_findings = LogAnalysisTools.extract_error_signature(request.logs)
        affected_files = LogAnalysisTools.identify_affected_files(request.logs)
        error_snippet = LogAnalysisTools.get_last_error_lines(request.logs)

        # 2. Try LLM execution if API key available
        if self.gemini_key:
            try:
                return self._analyze_with_gemini(request, tool_findings, affected_files, error_snippet)
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back to tool-agent parser.")

        # 3. Fallback: Intelligent Agent Heuristic Diagnostic Engine
        return self._analyze_with_agent_tools(request, tool_findings, affected_files, error_snippet)

    def _analyze_with_agent_tools(
        self, request: BuildAnalysisRequest, tool_findings: Dict[str, Any], affected_files: List[str], error_snippet: str
    ) -> BuildAnalysisResponse:
        logs_lower = request.logs.lower()
        
        affected_str = ", ".join(affected_files) if affected_files else "Build script / CI Pipeline Configuration"

        # Pattern 1: Missing Environment Variable
        if "database_url" in logs_lower or "env" in logs_lower and ("undefined" in logs_lower or "missing" in logs_lower):
            env_var = "DATABASE_URL" if "database_url" in logs_lower else "required configuration variable"
            return BuildAnalysisResponse(
                rootCause=f"Probable missing environment variable: {env_var}",
                explanation=f"The build pipeline attempted to execute a step requiring {env_var}, but the variable is not set in the CI environment.",
                affectedArea=affected_str if affected_str != "Build script / CI Pipeline Configuration" else "server/config/database.ts",
                suggestedFix=f"Configure '{env_var}' in your repository GitHub Actions secrets or environment variables.",
                confidence="High",
                limitations="Analysis based on terminal stack trace showing undefined variable reference during test suite boot."
            )

        # Pattern 2: Missing Package Dependency
        if "cannot find module" in logs_lower or "modulenotfounderror" in logs_lower:
            return BuildAnalysisResponse(
                rootCause="Probable missing node_modules / package dependency",
                explanation="The build failed during compilation because an imported module could not be resolved in node_modules.",
                affectedArea=affected_str if affected_str != "Build script / CI Pipeline Configuration" else "package.json / package-lock.json",
                suggestedFix="Verify that the dependency is declared in package.json and commit the updated lockfile after running npm install.",
                confidence="High",
                limitations="Analysis based on static module resolution failure logs."
            )

        # Pattern 3: TypeScript / Syntax Compilation Error
        if "typescript" in logs_lower or "syntaxerror" in logs_lower or "ts2" in logs_lower:
            return BuildAnalysisResponse(
                rootCause="Probable TypeScript compilation or code syntax error",
                explanation="The code failed type checking or contained invalid syntax preventing production bundle generation.",
                affectedArea=affected_str,
                suggestedFix="Run 'npm run lint' or 'npx tsc --noEmit' locally to fix reported type mismatches before pushing.",
                confidence="High",
                limitations="Analysis limited to compiler error output."
            )

        # Default Failure Diagnostic
        return BuildAnalysisResponse(
            rootCause="Probable test failure or non-zero build process exit code",
            explanation=f"The build pipeline failed during step execution. Last error lines:\n{error_snippet}",
            affectedArea=affected_str,
            suggestedFix="Review failing assertion traces in logs, test runner configuration, and dependencies.",
            confidence="Medium",
            limitations="Analysis derived from terminal output logs without full repository source AST context."
        )

    def _analyze_with_gemini(
        self, request: BuildAnalysisRequest, tool_findings: Dict[str, Any], affected_files: List[str], error_snippet: str
    ) -> BuildAnalysisResponse:
        import google.generativeai as genai
        genai.configure(api_key=self.gemini_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
You are an expert DevOps engineer analyzing a failed CI build for commit {request.commitHash} on branch {request.branch}.
Build logs:
{request.logs}

Detected error patterns: {json.dumps(tool_findings)}
Affected files: {affected_files}

Return ONLY a JSON object with these exact keys:
- rootCause: string (e.g. "Probable root cause...")
- explanation: string
- affectedArea: string
- suggestedFix: string
- confidence: string ("High", "Medium", or "Low")
- limitations: string

Do not claim guaranteed truth; use probabilistic wording like "Probable cause".
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text.strip())
        return BuildAnalysisResponse(**data)
