from typing import TypedDict, List, Optional, Annotated
import operator

class InterviewState(TypedDict):
    jd_raw: str
    jd_analysis: dict        # role, stack, seniority, themes
    questions: Annotated[list[dict], operator.add]     # {type, question, difficulty}
    current_index: int
    answers: list[dict]      # {question, answer, evaluation}
    scorecard: dict