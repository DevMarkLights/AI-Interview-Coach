
from langgraph.graph import StateGraph, END
from langgraph.types import Send
 
from graph.state import InterviewState
from graph.agents.jd_analyzer import analyze_jd
from graph.agents.question_generator import question_agent


def dispatch_question_agents(interviewState: InterviewState):
    return [Send("question_agent_node", {"jd_raw": interviewState["jd_raw"], "mode": mode, "jd_analysis": interviewState['jd_analysis'], 'numberOfQuestions':interviewState['numberOfQuestions']}) for mode, jd_analysis in interviewState['jd_analysis']['interview_focus_areas'].items()]


def build_interview_graph() -> StateGraph:
    graph = StateGraph(InterviewState)
 
    # Nodes
    graph.add_node("jd_analyzer_node", analyze_jd)
    graph.add_node("question_agent_node", question_agent)
 
    # Edges
    graph.set_entry_point("jd_analyzer_node")
    graph.add_conditional_edges("jd_analyzer_node", dispatch_question_agents)
    graph.add_edge("question_agent_node", END)
 
    return graph.compile()
 
 
# Singleton — import this in server.py
interview_graph = build_interview_graph()