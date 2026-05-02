import json
import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from graph.state import InterviewState
load_dotenv()

from graph.agents.loadModel import llm_small

_llm = llm_small

_SYSTEM_PROMPT = """
You are an expert technical recruiter and interview coach.
Given a raw job description, extract structured information and return ONLY valid JSON — 
no markdown, no backticks, no preamble.

USE Double Quotes for JSON not single quotes

Return exactly this shape:
{
  "role_title": "string",
  "company": "string or null",
  "seniority": "entry | mid | senior | staff | unknown",
  "domain": "string (e.g. Backend, ML/AI, Full Stack, Data Engineering, DevOps)",
  "tech_stack": ["list", "of", "technologies"],
  "key_responsibilities": ["up to 5 concise bullet strings"],
  "required_skills": ["hard skills explicitly required"],
  "preferred_skills": ["nice-to-have skills"],
  "interview_focus_areas": {
    "behavioral": ["relevant themes, e.g. cross-team collaboration, conflict resolution"],
    "technical": ["specific technical concepts likely to be tested"],
    "system_design": ["relevant design topics given the role"],
    "role_specific": ["domain-specific topics, e.g. model evaluation for ML roles"]
  },
  "summary": "Write an ORIGINAL 2-3 sentence synthesis, do not copy from the JD"
}
""".strip()


def analyze_jd(interviewState: InterviewState) -> dict:
  
    jd_raw = interviewState["jd_raw"]
    if not jd_raw or len(jd_raw.strip()) < 100:
        raise ValueError("JD text is too short to analyze.")

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": f"Analyze this job description:\n\n{jd_raw}"},
    ]

    response = _llm.invoke(messages)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        jd_analysis =  json.loads(raw)
        return {'jd_analysis': jd_analysis}
    except json.JSONDecodeError as e:
        raise ValueError(f"JD analyzer returned invalid JSON: {e}\n\nRaw output:\n{raw}") from e