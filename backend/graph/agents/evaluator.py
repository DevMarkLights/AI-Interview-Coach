import json
import os
from langchain_ollama import ChatOllama
from dotenv import load_dotenv

load_dotenv()

from graph.agents.loadModel import llm_small

_llm = llm_small



_BASE_CONTEXT = """
You are an expert technical interviewer and career coach evaluating a candidate's
interview answer. Be honest, specific, and constructive. 
Return ONLY valid JSON — no markdown, no backticks, no preamble.
""".strip()

_MODE_RUBRICS = {
    "behavioral": """
Evaluate this behavioral interview answer using the STAR framework.
Score each STAR component and provide specific, actionable feedback.

Return this exact shape:
{
  "mode": "behavioral",
  "score": <integer 1-10>,
  "verdict": "<Strong | Adequate | Needs Work>",
  "star_breakdown": {
    "situation": "<did they set clear context? what was missing?>",
    "task": "<did they define their specific role/responsibility?>",
    "action": "<did they describe concrete steps THEY took?>",
    "result": "<did they quantify or clearly state the outcome?>"
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "sample_addition": "<one concrete sentence they could add to strengthen the answer>"
}

Scoring guide:
9-10: Strong — all STAR components present, specific, quantified result
7-8: Strong — most components present, result could be stronger
5-6: Adequate — relevant but missing key STAR components
3-4: Needs Work — vague or generic, little structure
1-2: Needs Work — off-topic or no real answer
""".strip(),

    "technical": """
Evaluate this technical interview answer for accuracy, depth, and relevance to the role.

Return this exact shape:
{
  "mode": "technical",
  "score": <integer 1-10>,
  "verdict": "<Strong | Adequate | Needs Work>",
  "accuracy": "<was the answer technically correct? note any errors>",
  "depth": "<did they go beyond surface level? did they discuss tradeoffs?>",
  "relevance": "<did they tie their answer back to the role's domain and scale?>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "sample_addition": "<one concrete point they could add to strengthen the answer>"
}

Scoring guide:
9-10: Strong — technically accurate, discusses tradeoffs, ties to role context
7-8: Strong — mostly correct, some depth, minor gaps
5-6: Adequate — correct at surface level but lacks depth or role relevance
3-4: Needs Work — partially correct or missing key concepts
1-2: Needs Work — incorrect or off-topic
""".strip(),

    "system_design": """
Evaluate this system design interview answer for architecture quality, scalability thinking,
and awareness of tradeoffs.

Return this exact shape:
{
  "mode": "system_design",
  "score": <integer 1-10>,
  "verdict": "<Strong | Adequate | Needs Work>",
  "architecture": "<did they propose a coherent system design?>",
  "scalability": "<did they address scale requirements from the JD?>",
  "tradeoffs": "<did they acknowledge and reason through tradeoffs?>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "sample_addition": "<one concrete component or consideration they missed>"
}

Scoring guide:
9-10: Strong — coherent architecture, addresses scale, reasons through tradeoffs clearly
7-8: Strong — good structure, some gaps in scalability or tradeoff reasoning
5-6: Adequate — basic design present but missing key components or scale awareness
3-4: Needs Work — incomplete or unclear architecture
1-2: Needs Work — no real design proposed
""".strip(),

    "role_specific": """
Evaluate this domain-specific interview answer for depth of expertise, practical experience,
and alignment with the role's unique requirements.

Return this exact shape:
{
  "mode": "role_specific",
  "score": <integer 1-10>,
  "verdict": "<Strong | Adequate | Needs Work>",
  "domain_depth": "<did they demonstrate deep domain knowledge?>",
  "practical_experience": "<did they show hands-on experience vs theoretical knowledge?>",
  "role_alignment": "<did their answer align with this specific role's challenges?>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "sample_addition": "<one concrete point that would demonstrate deeper expertise>"
}

Scoring guide:
9-10: Strong — deep expertise, concrete experience, directly relevant to role
7-8: Strong — solid knowledge, some practical experience shown
5-6: Adequate — general knowledge but lacks depth or specificity
3-4: Needs Work — surface level, mostly theoretical
1-2: Needs Work — little relevant domain knowledge shown
""".strip(),
}


def evaluate_answer(question: dict, answer: str, jd_analysis: dict) -> dict:

    mode = question.get("mode", "technical")
    rubric = _MODE_RUBRICS.get(mode, _MODE_RUBRICS["technical"])

    if mode == "behavioral":
        guidance = question.get("star_guidance", "")
    else:
        guidance = question.get("strong_answer_hints") or question.get("key_considerations", "")

    user_prompt = f"""
        Role: {jd_analysis.get('role_title', 'Unknown')} at {jd_analysis.get('company', 'Unknown')}
        Seniority: {jd_analysis.get('seniority', 'unknown')}
        Domain: {jd_analysis.get('domain', 'unknown')}

        Question: {question.get('question', '')}
        Focus: {question.get('focus', '')}
        What a strong answer should cover: {guidance}

        Candidate's Answer:
        {answer}

        Evaluate this answer now.
        """.strip()

    messages = [
        {"role": "system", "content": f"{_BASE_CONTEXT}\n\n{rubric}"},
        {"role": "user", "content": user_prompt},
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
        evaluation = json.loads(raw)
        evaluation["question"] = question.get("question", "")
        evaluation["answer"] = answer
        return evaluation
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Evaluator returned invalid JSON: {e}\n\nRaw:\n{raw}"
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