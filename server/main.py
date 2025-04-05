from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/query")
async def query():
    return {"message": "query endpoint hit"}
