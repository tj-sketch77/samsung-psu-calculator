import yfinance as yf
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
import numpy as np

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 캐시 변수
cached_data = None
last_calculated_date = None

def calculate_vwap(df):
    if df.empty:
        return 0
    valid_df = df.dropna(subset=['Close', 'Volume'])
    if valid_df.empty:
        return 0
    return (valid_df['Close'] * valid_df['Volume']).sum() / valid_df['Volume'].sum()

def update_samsung_data():
    global cached_data, last_calculated_date
    
    print(f"[{datetime.now()}] 데이터 업데이트 시작...")
    ticker = "005930.KS"
    stock = yf.Ticker(ticker)
    df = stock.history(period="6mo") 
    
    if df.empty:
        return None

    df = df.sort_index(ascending=True)
    df = df.dropna(subset=['Open', 'High', 'Low', 'Close'])

    def get_vwap_for_days(days):
        target_df = df.tail(days) if len(df) >= days else df
        return calculate_vwap(target_df)

    vwap_1w = get_vwap_for_days(5)
    vwap_1m = get_vwap_for_days(20)
    vwap_2m = get_vwap_for_days(40)
    base_price = (vwap_1w + vwap_1m + vwap_2m) / 3
    current_price = float(df['Close'].iloc[-1])

    # PSU 관련 설정
    initial_base_price = 85385
    increase_rate = ((base_price - initial_base_price) / initial_base_price) * 100

    # 직급 및 구간별 지급 수량 로직
    cl1_cl2_shares = 0
    cl3_cl4_shares = 0

    if increase_rate < 20:
        cl1_cl2_shares = 0
        cl3_cl4_shares = 0
    elif 20 <= increase_rate < 40:
        cl1_cl2_shares = 100
        cl3_cl4_shares = 100
    elif 40 <= increase_rate < 60:
        cl1_cl2_shares = 200
        cl3_cl4_shares = 300
    elif 60 <= increase_rate < 80:
        cl1_cl2_shares = 260
        cl3_cl4_shares = 390
    elif 80 <= increase_rate < 100:
        cl1_cl2_shares = 340
        cl3_cl4_shares = 510
    else: # 100% 이상
        cl1_cl2_shares = 400
        cl3_cl4_shares = 600

    positions_data = [
        {
            "name": "CL1 / CL2",
            "shares": cl1_cl2_shares,
            "estimated_reward": round(cl1_cl2_shares * current_price)
        },
        {
            "name": "CL3 / CL4",
            "shares": cl3_cl4_shares,
            "estimated_reward": round(cl3_cl4_shares * current_price)
        }
    ]

    # Google Charts 형식: [Date, Low, Open, Close, High]
    chart_df = df.tail(30) # 최근 30거래일 (가독성을 위해)
    chart_data = []
    for index, row in chart_df.iterrows():
        chart_data.append([
            index.strftime('%m/%d'), # 날짜
            float(row['Low']),
            float(row['Open']),
            float(row['Close']),
            float(row['High'])
        ])

    cached_data = {
        "stock_name": "삼성전자",
        "ticker": ticker,
        "current_price": current_price,
        "vwap_1w": round(vwap_1w, 2),
        "vwap_1m": round(vwap_1m, 2),
        "vwap_2m": round(vwap_2m, 2),
        "base_price": round(base_price, 2),
        "initial_base_price": initial_base_price,
        "increase_rate": round(increase_rate, 2),
        "positions": positions_data,
        "chart_data": chart_data,
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    last_calculated_date = date.today()
    print(f"[{datetime.now()}] 데이터 업데이트 완료")
    return cached_data

@app.get("/api/samsung-base-price")
async def get_samsung_base_price():
    global cached_data, last_calculated_date
    if cached_data is None or last_calculated_date != date.today():
        update_samsung_data()
    return cached_data

if __name__ == "__main__":
    import uvicorn
    update_samsung_data()
    uvicorn.run(app, host="0.0.0.0", port=8000)
