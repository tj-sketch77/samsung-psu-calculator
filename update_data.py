import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta, timezone
import os

# 프로젝트 설정값
CONFIG = {
    "initial_base_price": 85385,
    "ticker": "005930.KS",
    "stock_name": "삼성전자",
    "target_date": "2028-10-13",
    "reward_tiers": [
        {"min_rate": 100, "cl1_shares": 400, "cl3_shares": 600},
        {"min_rate": 80,  "cl1_shares": 340, "cl3_shares": 510},
        {"min_rate": 60,  "cl1_shares": 260, "cl3_shares": 390},
        {"min_rate": 40,  "cl1_shares": 200, "cl3_shares": 300},
        {"min_rate": 20,  "cl1_shares": 100, "cl3_shares": 100},
        {"min_rate": 0,   "cl1_shares": 0,   "cl3_shares": 0}
    ]
}

def calculate_vwap(df):
    if df.empty:
        return 0
    valid_df = df.dropna(subset=['Close', 'Volume'])
    if valid_df.empty:
        return 0
    return (valid_df['Close'] * valid_df['Volume']).sum() / valid_df['Volume'].sum()

def fetch_and_save():
    # KST (UTC+9) 시간 강제 계산
    kst_now = datetime.now(timezone.utc) + timedelta(hours=9)
    print(f"[{kst_now}] 데이터 수집 시작 (KST)...")
    
    ticker = CONFIG["ticker"]
    stock = yf.Ticker(ticker)
    df = stock.history(period="6mo") 
    
    if df.empty:
        print("데이터를 가져오지 못했습니다.")
        return

    # 데이터 정렬 및 0원/NaN 데이터 제거
    df = df.sort_index(ascending=True)
    df = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
    df = df[(df[['Open', 'High', 'Low', 'Close']] != 0).all(axis=1)]

    def get_vwap_for_days(days):
        target_df = df.tail(days) if len(df) >= days else df
        return calculate_vwap(target_df)

    vwap_1w = get_vwap_for_days(5)
    vwap_1m = get_vwap_for_days(20)
    vwap_2m = get_vwap_for_days(40)
    base_price = (vwap_1w + vwap_1m + vwap_2m) / 3
    current_price = float(df['Close'].iloc[-1])

    initial_base_price = CONFIG["initial_base_price"]
    increase_rate = ((base_price - initial_base_price) / initial_base_price) * 100

    # 보상 수량 계산 (설정된 티어 기반)
    cl1_shares, cl3_shares = 0, 0
    for tier in CONFIG["reward_tiers"]:
        if increase_rate >= tier["min_rate"]:
            cl1_shares = tier["cl1_shares"]
            cl3_shares = tier["cl3_shares"]
            break

    positions_data = [
        {
            "name": "CL1 / CL2",
            "shares": cl1_shares,
            "estimated_reward": round(cl1_shares * current_price)
        },
        {
            "name": "CL3 / CL4",
            "shares": cl3_shares,
            "estimated_reward": round(cl3_shares * current_price)
        }
    ]

    chart_df = df.tail(30)
    chart_data = []
    for index, row in chart_df.iterrows():
        chart_data.append([
            index.strftime('%m/%d'),
            float(row['Low']),
            float(row['Open']),
            float(row['Close']),
            float(row['High'])
        ])

    result = {
        "stock_name": CONFIG["stock_name"],
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
        "target_date": CONFIG["target_date"],
        "last_updated": kst_now.strftime("%Y-%m-%d %H:%M:%S") + " (KST)"
    }

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    
    print(f"[{kst_now}] data.json 저장 완료 (KST)")

if __name__ == "__main__":
    fetch_and_save()
