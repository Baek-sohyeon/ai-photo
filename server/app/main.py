from fastapi import FastAPI, File, UploadFile, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
import io
from PIL import Image

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (개발용)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메소드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

router = APIRouter()
openai.api_key = 'API key'  # 적절한 API 키를 입력하세요.

@router.post("/transform-image/")
async def transform_image(file: UploadFile = File(...)):
    file_content = await file.read()

    # 파일 크기 확인
    if len(file_content) > 4 * 1024 * 1024:  # 4MB 이상이면 오류 발생
        raise HTTPException(status_code=400, detail="Uploaded image must be less than 4 MB.")

    # 파일 포맷 확인
    try:
        image = Image.open(io.BytesIO(file_content))
        if image.format != 'PNG':
            raise HTTPException(status_code=400, detail="Uploaded image must be a PNG.")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    # OpenAI API를 사용하여 이미지 처리
    try:
        response = openai.Image.create_variation(
            image=io.BytesIO(file_content),
            n=1,
            size="1024x1024"
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

    return JSONResponse(content={"url": response['data'][0]['url']})

app.include_router(router)
