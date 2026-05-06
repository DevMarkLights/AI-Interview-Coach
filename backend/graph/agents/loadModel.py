from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq

import os
from dotenv import load_dotenv
load_dotenv()

llm_small = None
llm_large = None

if os.getenv("USE_LOCAL") == 'true':
    print('local model')
    llm_small = ChatOllama(model=os.getenv('OLLAMA_MODEL'), temperature=0, num_predict=2048, num_ctx=2048)
    llm_large = ChatOllama(model=os.getenv('OLLAMA_MODEL'), temperature=0, num_predict=2048, num_ctx=2048)
else:
    print('cloud model')
    llm_small = ChatGroq(model=os.getenv("GROQ_MODEL_SMALL"), temperature=0, max_tokens=2048)
    llm_large = ChatGroq(model=os.getenv("GROQ_MODEL_LARGE"), temperature=0.3, max_tokens=1280)
    # using smaller context because each question generation does not need 4096 tokens
