from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from detector import MoneyMulingDetector  # Importing the logic we wrote
import pandas as pd
import io
import uvicorn

app = FastAPI(title="RIFT 2026: Money Muling Detection Engine")

# ENABLE CORS: Essential for the React Frontend to communicate
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-link.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUIRED_COLUMNS = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']

@app.get("/")
def health_check():
    return {"status": "active", "engine": "MoneyMulingDetector_v1.0"}

@app.post("/analyze")
async def analyze_transactions(file: UploadFile = File(...)):
    # 1. Validation: Ensure it's a CSV
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")

    try:
        # 2. Read file into memory buffer
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # 3. Exact Structure Validation (Per PDF Page 1)
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing mandatory columns: {', '.join(missing_cols)}"
            )

        # 4. Run the Mastermind Detection Logic
        detector = MoneyMulingDetector(df) # We modified this to accept DF directly
        
        # Run algorithms in sequence
        detector.detect_cycles()
        detector.detect_smurfing()
        detector.detect_shell_networks()
        
        # 5. Generate JSON Output (Matches EXACT format required on Page 2)
        results = detector.get_final_json()
        
        return results

    except Exception as e:
        print(f"Error processing: {str(e)}") # Server-side logging
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
