import json
import os
from langchain_ollama import ChatOllama
from dotenv import load_dotenv

load_dotenv()
from graph.agents.loadModel import llm_small

_llm = llm_small


HIRING_SIGNAL_THRESHOLDS = {
    "Strong Yes": 8.5,
    "Yes": 7.0,
    "Maybe": 5.5,
    "No": 0,
}


def _compute_hiring_signal(overall_score: float) -> str:
    for signal, threshold in HIRING_SIGNAL_THRESHOLDS.items():
        if overall_score >= threshold:
            return signal
    return "No"


_SYSTEM_PROMPT = """
    You are an expert technical interviewer writing a final candidate assessment.
    You will be given a set of interview question evaluations across multiple modes.
    Synthesize them into an honest, specific, actionable summary.
    Return ONLY valid JSON — no markdown, no backticks, no preamble.

    Return this exact shape:
    {
    "top_strengths": [
        "<specific strength drawn from evaluations — not generic>",
        "<specific strength 2>",
        "<specific strength 3>"
    ],
    "top_improvements": [
        "<specific improvement area drawn from evaluations — not generic>",
        "<specific improvement 2>",
        "<specific improvement 3>"
    ],
    "mode_summaries": {
        "<mode>": "<1 sentence summary of performance in this mode>"
    },
    "overall_summary": "<3-4 sentence honest assessment of the candidate. Reference specific answers. Note any critical gaps for this role.>"
    }
    """.strip()



def generate_scorecard(evaluations: list[dict], jd_analysis: dict) -> dict:
 
    if not evaluations:
        raise ValueError("No evaluations provided to scorecard generator.")

    scores_by_mode = {}
    for ev in evaluations:
        mode = ev.get("mode", "unknown")
        score = ev.get("score", 0)
        scores_by_mode.setdefault(mode, []).append(score)

    per_mode_scores = {
        mode: round(sum(scores) / len(scores), 1)
        for mode, scores in scores_by_mode.items()
    }

    all_scores = [ev.get("score", 0) for ev in evaluations]
    overall_score = round(sum(all_scores) / len(all_scores), 1)
    hiring_signal = _compute_hiring_signal(overall_score)

    eval_summary = json.dumps([
        {
            "mode": ev.get("mode"),
            "question": ev.get("question"),
            "score": ev.get("score"),
            "verdict": ev.get("verdict"),
            "strengths": ev.get("strengths", []),
            "improvements": ev.get("improvements", []),
        }
        for ev in evaluations
    ], indent=2)

    user_prompt = f"""
        Role: {jd_analysis.get('role_title', 'Unknown')} at {jd_analysis.get('company', 'Unknown')}
        Seniority: {jd_analysis.get('seniority', 'unknown')}
        Domain: {jd_analysis.get('domain', 'unknown')}

        Overall Score: {overall_score}/10
        Per-Mode Scores: {json.dumps(per_mode_scores)}
        Hiring Signal: {hiring_signal}

        Evaluations:
        {eval_summary}

        Write the final candidate scorecard now.
        """.strip()

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
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
        llm_output = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Scorecard LLM returned invalid JSON: {e}\n\nRaw:\n{raw}") from e

    return {
        "overall_score": overall_score,
        "max_score": 10,
        "hiring_signal": hiring_signal,
        "per_mode_scores": per_mode_scores,
        "top_strengths": llm_output.get("top_strengths", []),
        "top_improvements": llm_output.get("top_improvements", []),
        "mode_summaries": llm_output.get("mode_summaries", {}),
        "overall_summary": llm_output.get("overall_summary", ""),
    }


def _repair_truncated_json(raw: str) -> str:
    stripped = raw.rstrip()
    if stripped and stripped[-1] not in ('"', '}', ']'):
        stripped += '"'
    open_brackets = stripped.count("[") - stripped.count("]")
    open_braces = stripped.count("{") - stripped.count("}")
    stripped += "]" * max(open_brackets, 0)
    stripped += "}" * max(open_braces, 0)
    return stripped