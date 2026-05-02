import json
import os
from langchain_ollama import ChatOllama
from dotenv import load_dotenv
from graph.state import InterviewState
load_dotenv()

from graph.agents.loadModel import llm_small

_llm = llm_small

NUMBER_OF_QUESTIONS = 1

_BASE_CONTEXT = """
You are an expert technical interviewer. Generate interview questions based on the
provided job description analysis. Return ONLY valid JSON — no markdown, no backticks,
no preamble.
""".strip()

_MODE_PROMPTS = {
    "behavioral": """
Generate /NUMBER_OF_Questions/ behavioral interview questions using the STAR format (Situation, Task, Action, Result).
Questions should be grounded in the specific responsibilities and themes from the JD analysis.
Avoid generic questions — make them specific to this role and company context.

Generate EXACTLY /NUMBER_OF_Questions/ question. Do not generate more. The "questions" array must contain exactly /NUMBER_OF_Questions/ item(s).

Return this exact shape:
{
  "mode": "behavioral",
  "questions": [
    {
      "question": "full question text",
      "focus": "what this question is evaluating",
      "star_guidance": "what a strong STAR answer should cover for this specific question"
    }
  ]
}
""".strip(),

    "technical": """
Generate /NUMBER_OF_Questions/ technical interview questions targeting the specific tech stack and concepts
from the JD analysis. Mix conceptual understanding with applied problem-solving.
Calibrate difficulty to the seniority level.

Generate EXACTLY /NUMBER_OF_Questions/ question. Do not generate more. The "questions" array must contain exactly /NUMBER_OF_Questions/ item(s).

Return this exact shape:
{
  "mode": "technical",
  "questions": [
    {
      "question": "full question text",
      "focus": "concept or skill being tested",
      "strong_answer_hints": "key points a strong answer should hit"
    }
  ]
}
""".strip(),

    "system_design": """
Generate /NUMBER_OF_Questions/ system design interview questions relevant to the role's domain and scale requirements.
Questions should reflect real design challenges implied by the JD.
Calibrate scope to the seniority level.

Generate EXACTLY /NUMBER_OF_Questions/ question. Do not generate more. The "questions" array must contain exactly /NUMBER_OF_Questions/ item(s).

Return this exact shape:
{
  "mode": "system_design",
  "questions": [
    {
      "question": "full question text",
      "focus": "design area being evaluated",
      "key_considerations": "components, tradeoffs, or constraints a strong answer should address"
    }
  ]
}
""".strip(),

    "role_specific": """
Generate /NUMBER_OF_Questions/ role-specific interview questions targeting the unique domain knowledge
required for this position (e.g. ML-specific, security-specific, data engineering-specific).
These should be questions only someone with deep domain expertise could answer well.

Generate EXACTLY /NUMBER_OF_Questions/ question. Do not generate more. The "questions" array must contain exactly /NUMBER_OF_Questions/ item(s).

Return this exact shape:
{
  "mode": "role_specific",
  "questions": [
    {
      "question": "full question text",
      "focus": "domain expertise being evaluated",
      "strong_answer_hints": "key points a strong answer should hit"
    }
  ]
}
""".strip(),
}

def _build_user_prompt(mode: str, jd_analysis: dict) -> str:
    focus_areas = jd_analysis.get("interview_focus_areas", {})
    mode_focus = focus_areas.get(mode, [])

    return f"""

        Role: {jd_analysis.get('role_title', 'Unknown')} at {jd_analysis.get('company', 'Unknown')}
        Seniority: {jd_analysis.get('seniority', 'unknown')}
        Domain: {jd_analysis.get('domain', 'unknown')}
        Tech Stack: {', '.join(jd_analysis.get('tech_stack', []))}
        Key Responsibilities: {json.dumps(jd_analysis.get('key_responsibilities', []))}
        Focus Areas for {mode}: {json.dumps(mode_focus)}
        Role Summary: {jd_analysis.get('summary', '')}

        Generate {mode} interview questions now.
        """.strip()


def question_agent(interviewState: InterviewState) -> list[dict]:

    mode = interviewState['mode']
    sys_prompt = _MODE_PROMPTS[interviewState['mode']].replace("/NUMBER_OF_Questions/", str(NUMBER_OF_QUESTIONS))
    messages = [
        {"role": "system", "content": f"{_BASE_CONTEXT}\n\n{sys_prompt}"},
        {"role": "user", "content": _build_user_prompt(interviewState['mode'], interviewState['jd_analysis'])},
    ]

    response = _llm.invoke(messages)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    raw = _repair_truncated_json(raw)

    try:
        parsed = json.loads(raw)
        questions = parsed.get("questions", [])
        for q in questions:
            q["mode"] = mode
        return {"questions": questions}
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Question generator ({mode}) returned invalid JSON: {e}\n\nRaw:\n{raw}"
        ) from e


def _repair_truncated_json(raw: str) -> str:
    stripped = raw.rstrip()
    if stripped and stripped[-1] not in ('"', '}', ']'):
        stripped += '"'
    open_brackets = stripped.count("[") - stripped.count("]")
    open_braces = stripped.count("{") - stripped.count("}")
    stripped += "]" * max(open_brackets, 0)
    stripped += "}" * max(open_braces, 0)
    return stripped