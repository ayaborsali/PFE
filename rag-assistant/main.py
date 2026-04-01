from fastapi import FastAPI, HTTPException
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
import pandas as pd
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel
import logging

# =============================
# CONFIG
# =============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="RAG Assistant API", version="PRO MAX")

llm = None
vector_db = None

# =============================
# MODELS
# =============================
class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    response: str
    sources: list = []

# =============================
# SKILLS (SMART)
# =============================
SKILLS_MAP = {
    "python": ["python"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning", "dl", "neural network"],
    "data science": ["data science", "data scientist"],
    "sql": ["sql"],
    "java": ["java"],
    "javascript": ["javascript", "js"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
}

def extract_skills(text):
    text = text.lower()
    found = []

    for skill, variants in SKILLS_MAP.items():
        for v in variants:
            if v in text:
                found.append(skill)
                break

    return list(set(found))


def compute_score(query_skills, candidate_skills):
    if not query_skills:
        return 0

    match = len(set(query_skills) & set(candidate_skills))
    return int((match / len(query_skills)) * 100)

# =============================
# QUESTION ROUTER (IMPORTANT)
# =============================
def is_general_question(question):
    q = question.lower()

    keywords = [
        "bonjour", "salut", "hello",
        "qui es-tu", "tu fais quoi",
        "aide", "help",
        "comment fonctionne", "application"
    ]

    return any(k in q for k in keywords)

# =============================
# INIT RAG
# =============================
def initialize_rag_system():
    try:
        logger.info("🚀 Initialisation RAG...")

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("❌ GROQ_API_KEY manquante")

        llm = ChatGroq(
            model_name="llama-3.1-8b-instant",
            api_key=api_key,
            temperature=0.2
        )

        df = pd.read_csv("data/Curriculum Vitae.csv")
        df.columns = df.columns.str.strip().str.lower()

        logger.info(f"✅ CSV chargé : {len(df)} lignes")

        documents = []

        for i, row in df.iterrows():
            resume = str(row.get("resume", ""))
            category = str(row.get("category", ""))

            text = f"""
CANDIDATE ID: {i}
Category: {category}

FULL RESUME:
{resume}
"""

            documents.append(
                Document(
                    page_content=text.strip(),
                    metadata={"index": i}
                )
            )

        # 🔥 CHUNK
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,
            chunk_overlap=200
        )

        chunks = splitter.split_documents(documents)

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )

        persist_dir = "./chroma_db"

        if not os.path.exists(persist_dir):
            os.makedirs(persist_dir)

        if len(os.listdir(persist_dir)) == 0:
            logger.info("📦 Création DB...")
            db = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=persist_dir
            )
        else:
            logger.info("📂 Chargement DB...")
            db = Chroma(
                persist_directory=persist_dir,
                embedding_function=embeddings
            )

        logger.info("✅ RAG prêt")
        return llm, db

    except Exception as e:
        logger.error(f"❌ Erreur init : {e}")
        return None, None


@app.on_event("startup")
def startup_event():
    global llm, vector_db
    llm, vector_db = initialize_rag_system()

# =============================
# CHAT ENDPOINT
# =============================
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):

    if llm is None or vector_db is None:
        raise HTTPException(status_code=503, detail="RAG non prêt")

    try:
        question = request.question.strip()

        # =============================
        # 1. QUESTIONS SIMPLES
        # =============================
        if is_general_question(question):

            prompt = f"""
You are a friendly HR assistant.

APPLICATION CONTEXT:
- This app helps recruiters find candidates
- It analyzes CVs using AI
- It ranks candidates based on skills

Answer clearly.

Question:
{question}

Answer:
"""
            response = llm.invoke(prompt)

            return ChatResponse(
                response=response.content.strip(),
                sources=[]
            )

        # =============================
        # 2. RAG SEARCH
        # =============================
        query_skills = extract_skills(question)

        enriched_query = f"""
Find relevant candidates for:
{question}

Include similar skills and technologies.
"""

        results = vector_db.similarity_search(enriched_query, k=12)

        if not results:
            return ChatResponse(
                response="Aucun candidat trouvé.",
                sources=[]
            )

        # =============================
        # 3. REMOVE DUPLICATES + SCORING
        # =============================
        candidates_map = {}

        for doc in results:
            cid = doc.metadata.get("index")
            text = doc.page_content

            skills = extract_skills(text)
            score = compute_score(query_skills, skills)

            if cid not in candidates_map:
                candidates_map[cid] = {
                    "id": cid,
                    "text": text,
                    "skills": skills,
                    "score": score
                }
            else:
                if score > candidates_map[cid]["score"]:
                    candidates_map[cid]["score"] = score

        ranked = list(candidates_map.values())

        ranked = [c for c in ranked if c["score"] >= 20]

        if not ranked:
            return ChatResponse(
                response="Aucun candidat pertinent trouvé.",
                sources=[]
            )

        ranked.sort(key=lambda x: x["score"], reverse=True)
        top = ranked[:5]

        # =============================
        # 4. CONTEXT
        # =============================
        context = "\n\n".join([
            f"""
ID: {c['id']}
Score: {c['score']}%
Skills: {', '.join(c['skills'])}

Resume:
{c['text'][:800]}
"""
            for c in top
        ])

        # =============================
        # 5. PROMPT
        # =============================
        prompt = f"""
You are an expert recruiter.

RULES:
- Use ONLY CV data
- Do NOT invent anything

TASK:
- Rank candidates
- Explain briefly
- Keep scores

FORMAT:

1. Candidate ID:
   Score: X%
   Skills: ...
   Explanation: ...

DATA:
{context}

QUESTION:
{question}

ANSWER:
"""

        response = llm.invoke(prompt)

        return ChatResponse(
            response=response.content.strip(),
            sources=[c["id"] for c in top]
        )

    except Exception as e:
        logger.error(f"❌ Erreur chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================
# ROUTES TEST
# =============================
@app.get("/")
def home():
    return {"status": "API OK"}

@app.get("/health")
def health():
    return {"status": "ok"}

# =============================
# RUN
# =============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)