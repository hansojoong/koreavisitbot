from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List, Dict, Union

load_dotenv()

# --- Gemini API 초기화 ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

app = FastAPI()

# --- CORS 설정 ---
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 기본 라우트 ---
@app.get("/")
async def read_root():
    return {"message": "FastAPI server is running for your Korean Travel Companion!"}

# --- Gemini 챗 엔드포인트 ---
class Query(BaseModel):
    message: str
    history: List[Dict[str, Union[str, List[Dict[str, str]]]]] = Field(default_factory=list)

@app.post("/chat")
async def chat_with_gemini(query: Query):
    try:
        gemini_history = []

        # --- 시스템 프롬프트 ---
        system_instruction = {
            "role": "user",
            "parts": [{
                "text": (
                    "너는 친절하고 매우 유능한 '한국 여행 전문 가이드'야. 모든 답변은 한국어로 해줘. "
                    "너는 사용자와의 현재 대화 맥락을 가장 중요하게 고려해야 해. 특히, 사용자가 이전에 언급한 한국의 도시나 장소를 "
                    "'거기', '그곳', '그 나라' 등으로 지칭할 경우, 가장 최근에 언급된 한국의 장소나 주제를 우선적으로 맥락으로 삼아 답변을 생성해야 해. "
                    "한국의 맛집, 관광지, 교통편, 문화 등 한국 여행과 관련된 구체적인 정보 요청 시에도 이전 대화의 한국 장소 맥락을 유지해야 해. "
                    "아래에 몇 가지 대화 예시가 주어질 거야. 이 예시들은 네가 한국 여행 가이드로서 어떻게 대화에 참여하고, 맥락을 이해하고, 답변을 구성해야 하는지 "
                    "보여주는 '행동 가이드라인'일 뿐이야. 예시의 '내용'을 그대로 복사하거나, 예시에서 언급된 장소를 실제 대화의 장소와 혼동해서는 절대 안 돼. "
                    "오직 '대화 방식'과 '맥락 이해 방식'만 참고하고, 실제 대화는 예시 뒤에 이어서 제공될 거야. 현재 대화의 내용과 흐름을 최우선으로 파악하고 답변해야 해. "
                    "**한국 여행과 무관한 질문이 들어오면, 정중하고 부드럽게 안내해줘. 예: '죄송하지만, 저는 한국 여행에 특화된 가이드입니다. 한국과 관련된 질문을 해주시면 더 정확하게 도와드릴 수 있어요 🙂'**"
                    "만약 사용자가 역사 질문을 하면, 간단히 정확하게 답변해줘. 예를 들어, "
                    "'조선의 5대 임금은 태조, 정종, 태종, 세종, 문종입니다.'와 같이 알려줘."
                    "그러나 여행 정보와 무관한 질문이 너무 많으면, 정중히 여행 관련 질문을 유도해줘."
                )
            }]
        }
        gemini_history.append(system_instruction)

        # --- 다국어 첫인사 부분 제거 --- 
        # (기존에 아래 부분이 있었으나 삭제함)
        # gemini_history.append({
        #     "role": "model",
        #     "parts": [{
        #         "text": (
        #             "안녕하세요, 한국 여행 가이드입니다!\n"
        #             "Hello, I'm your Korean travel guide!\n"
        #             "こんにちは、韓国の旅行ガイドです！\n"
        #             "무엇이든 편하게 물어보세요."
        #         )
        #     }]
        # })

        # --- 예시 대화 1: 서울 맥락 이해 ---
        gemini_history.append({"role": "user", "parts": [{"text": "서울 여행 추천해줘."}]})
        gemini_history.append({"role": "model", "parts": [{"text": "서울은 한국의 수도로, 경복궁, 남산타워, 명동 등 볼거리가 많아요. 한강에서 유람선을 타거나, K-POP 문화를 즐기는 것도 추천해요."}]})
        gemini_history.append({"role": "user", "parts": [{"text": "거기 옆에 도시는 어디야?"}]})
        gemini_history.append({"role": "model", "parts": [{"text": "서울 옆에는 수원, 인천, 고양 등 경기도의 여러 도시들이 가까이 있어요. 특히 수원은 수원화성으로 유명하죠."}]})

        # --- 예시 대화 2: 제주도 맛집 추천 ---
        gemini_history.append({"role": "user", "parts": [{"text": "제주도 여행 추천해줘."}]})
        gemini_history.append({"role": "model", "parts": [{"text": "제주도는 한국의 아름다운 섬으로, 한라산, 성산일출봉, 섭지코지 등 자연경관이 뛰어나요. 올레길 걷기나 해변 카페 투어도 좋아요."}]})
        gemini_history.append({"role": "user", "parts": [{"text": "거기 맛집 하나만 찾아줘."}]})
        gemini_history.append({"role": "model", "parts": [{"text": "제주도에는 정말 맛집이 많아요! 어떤 종류의 음식을 선호하시나요? 흑돼지, 해산물, 아니면 향토 음식을 찾으시나요? 예를 들어, 흑돼지로는 '돈사돈', 해산물로는 '제주김만복'을 추천해요."}]})

        # --- 사용자 히스토리 추가 ---
        for msg in query.history:
            role = 'user' if msg['sender'] == 'user' else 'model'
            gemini_history.append({
                "role": role,
                "parts": [{"text": msg['text']}]
            })

        # --- Gemini 응답 생성 ---
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(query.message)
        text_response = response.text

        return {"reply": text_response}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {"reply": "죄송합니다, 답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
