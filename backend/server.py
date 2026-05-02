import asyncio
import subprocess
import time

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, Body, Form, WebSocket, WebSocketDisconnect
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from langgraph.graph import StateGraph, END
from langgraph.types import Send
from graph.state import InterviewState
from graph.agents.jd_analyzer import analyze_jd
from graph.agents.evaluator import evaluate_answer
from graph.agents.question_generator import question_agent
from graph.agents.scorecard import generate_scorecard
from utils.scraper import scrape_jd_from_url
from pathlib import Path
from graph.agents.loadModel import llm_small, llm_large #load model one time
from graph.pipeline import interview_graph
import logging

logging.basicConfig(level=logging.ERROR)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)


# from test_data import job_desc, SAMPLE_ANSWERS

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # MUST be FALSE
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/ai-interview-coach/analyze")
async def analyze(request: Request):
    body = await request.json()
    if 'job_description' in body:
        jd = body.get('job_description')
        
        try:
           result = await interview_graph.ainvoke({'jd_raw': jd})
           return {'result': result}
        except Exception as e:
            logging.error(e)
            raise HTTPException(status_code=500, detail={'error': str(e)}) 
    else:
        return {'error': 'job_description not in request'}

@app.post("/ai-interview-coach/answer")
async def answer(request: Request):
    body = await request.json()
    if 'questions' in body and 'jd_analysis' in body:
        questions = body.get('questions')[0]
        jda = body.get('jd_analysis')
        try:
            result = evaluate_answer(question=questions, answer=questions['answer'], jd_analysis=jda)
               
            return {'result' : result}
        
        except Exception as e:
            logging.error(e)
            raise HTTPException(status_code=500, detail={'error': str(e)}) 
            
    else:
        return {'error': 'questions/jd_analysis not in request'}

@app.post("/ai-interview-coach/scorecard")
async def answer(request: Request):
    body = await request.json()
    if 'evaluations' in body and 'jd_analysis' in body:
        evaluations = body.get('evaluations')
        jda = body.get('jd_analysis')
        try:
            result = generate_scorecard(evaluations=evaluations, jd_analysis=jda)
               
            return {'result' : result}
        
        except Exception as e:
            logging.error(e)
            raise HTTPException(status_code=500, detail={'error': str(e)}) 
            
    else:
        return {'error': 'questions/jd_analysis not in request'}
    

if __name__ == "__main__":
    
    # result = interview_graph.invoke({"jd_raw": job_desc})

    
    # by_mode = {}
    # for q in result["questions"]:
    #     by_mode.setdefault(q["mode"], []).append(q)
    
    # EVALUTAIONS = []
    # # Test one question per mode
    # for mode, sample_answer in SAMPLE_ANSWERS.items():
    #     questions = by_mode.get(mode, [])
    #     if not questions:
    #         print(f"⚠️  No questions found for mode: {mode}\n")
    #         continue
 
    #     question = questions[0]
 
    #     evaluation = evaluate_answer(
    #         question=question,
    #         answer=sample_answer,
    #         jd_analysis=result["jd_analysis"]
    #     )
    #     EVALUTAIONS.append(evaluation)

    # print(generate_scorecard(EVALUTAIONS,result['jd_analysis']))
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8088,
        log_level="debug",
        reload=False,
        ws_ping_interval=30, 
        ws_ping_timeout=300
    )
    