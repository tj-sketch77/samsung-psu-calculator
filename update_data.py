import yfinance as yf
import pandas as pd
import json
from datetime import datetime
import os

def calculate_vwap(df):
    if df.empty:
        return 0
    valid_df = df.dropna(subset=['Close', 'Volume'])
    if valid_df.empty:
        return 0
    return (valid_df['Close'] * valid_df['Volume']).sum() / valid_df['Volume'].sum()

def fetch_and_save():
    print(f"[{datetime.now()}] 데이터 수집 시작...")
    ticker = "005930.KS"
    stock = yf.Ticker(ticker)
    df = stock.history(period="6mo") 
    
    if df.empty:
        print("데이터를 가져오지 못했습니다.")
        return

    # 데이터 정렬 및 0원/NaN 데이터 제거 (차트 0원 방지)
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

    initial_base_price = 85385
    increase_rate = ((base_price - initial_base_price) / initial_base_price) * 100

    positions_data = [
        {
            "name": "CL1 / CL2",
            "shares": 0,
            "estimated_reward": 0
        },
        {
            "name": "CL3 / CL4",
            "shares": 0,
            "estimated_reward": 0
        }
    ]

    # 보상 로직 적용
    cl1_shares, cl3_shares = 0, 0
    if 20 <= increase_rate < 40: cl1_shares, cl3_shares = 100, 100
    elif 40 <= increase_rate < 60: cl1_shares, cl3_shares = 200, 300
    elif 60 <= increase_rate < 80: cl1_shares, cl3_shares = 260, 390
    elif 80 <= increase_rate < 100: cl1_shares, cl3_shares = 340, 510
    elif increase_rate >= 100: cl1_shares, cl3_shares = 400, 600

    positions_data[0]["shares"] = cl1_shares
    positions_data[0]["estimated_reward"] = round(cl1_shares * current_price)
    positions_data[1]["shares"] = cl3_shares
    positions_data[1]["estimated_reward"] = round(cl3_shares * current_price)

    # 차트 데이터 (최근 30일)
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
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " (KST)"
    }

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    
    print(f"[{datetime.now()}] data.json 저장 완료 (KST)")

if __name__ == "__main__":
    fetch_and_save()
