"""
Build Log Analysis Tools for DevPulse AI Agent.
Extracts error signatures, stack traces, environment issues, and missing dependencies.
"""
import re
from typing import Dict, Any, List

class LogAnalysisTools:
    @staticmethod
    def extract_error_signature(logs: str) -> Dict[str, Any]:
        """Scans logs for common error patterns, exceptions, and stack traces."""
        patterns = [
            (r"Error: Environment variable ([A-Z0-9_]+) is (undefined|missing|not defined)", "env_missing"),
            (r"Cannot find module ['\"]([^'\"]+)['\"]", "missing_dependency"),
            (r"ModuleNotFoundError: No module named ['\"]([^'\"]+)['\"]", "missing_dependency"),
            (r"SyntaxError: ([^\n]+)", "syntax_error"),
            (r"error TS\d+: ([^\n]+)", "typescript_error"),
            (r"AssertionError: ([^\n]+)", "test_assertion_failed"),
            (r"Command failed with exit code (\d+)", "process_exit_code"),
            (r"FATAL ERROR: ([^\n]+)", "fatal_error"),
        ]
        
        matches = []
        for pattern, category in patterns:
            found = re.findall(pattern, logs, re.IGNORECASE)
            if found:
                matches.append({"category": category, "details": found})
                
        return {
            "has_errors": len(matches) > 0,
            "detected_categories": matches,
            "log_line_count": len(logs.splitlines()),
        }

    @staticmethod
    def identify_affected_files(logs: str) -> List[str]:
        """Parses stack traces and file paths in logs."""
        file_pattern = r"at [^\n]*\(([^:]+):(\d+):(\d+)\)|in ([a-zA-Z0-9_\-/\\]+\.(?:ts|js|py|json|yml|yaml|go|rs)):(\d+)"
        matches = re.findall(file_pattern, logs)
        
        affected_files = set()
        for match in matches:
            file_path = match[0] or match[3]
            if file_path and not "node_modules" in file_path and not "internal/" in file_path:
                affected_files.add(file_path)
                
        return list(affected_files)

    @staticmethod
    def get_last_error_lines(logs: str, max_lines: int = 10) -> str:
        """Extracts the trailing log lines where errors usually concentrate."""
        lines = logs.splitlines()
        error_lines = [line for line in lines if any(k in line.lower() for k in ['error', 'fail', 'except', 'fatal', 'exit', '✗'])]
        if error_lines:
            return "\n".join(error_lines[-max_lines:])
        return "\n".join(lines[-max_lines:])
