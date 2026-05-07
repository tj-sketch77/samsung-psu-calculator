import yfinance as yf
import pandas as pd
import json
from datetime import datetime
from zoneinfo import ZoneInfo

# 프로젝트 설정값
CONFIG = {
    "initial_base_price": 85385,
    "ticker": "005930.KS",
    "fx_ticker": "KRW=X",
    "stock_name": "삼성전자",
    "target_date": "2028-10-13",
    "base_shares": {
        "cl1": 200,
        "cl3": 300
    },
    "reward_tiers": [
        {"min_rate": 100, "payout_rate": 200, "label_ko": "100% 이상: 최대 2배 지급", "label_en": ">= 100%: Up to 2x payout"},
        {"min_rate": 40, "payout_rate": 100, "label_ko": "40% 이상~100% 미만: 100% 지급", "label_en": "40% to <100%: 100% payout"},
        {"min_rate": 20, "payout_rate": 50, "label_ko": "20% 이상~40% 미만: 50% 지급", "label_en": "20% to <40%: 50% payout"},
        {"min_rate": 0, "payout_rate": 0, "label_ko": "20% 미만: 미지급", "label_en": "< 20%: No payout"}
    ]
}

def calculate_vwap(df):
    if df.empty:
        return 0
    valid_df = df.dropna(subset=['Close', 'Volume'])
    valid_df = valid_df[valid_df['Volume'] > 0]
    if valid_df.empty:
        return 0
    return (valid_df['Close'] * valid_df['Volume']).sum() / valid_df['Volume'].sum()

def get_reward_tier(increase_rate):
    for tier in CONFIG["reward_tiers"]:
        if increase_rate >= tier["min_rate"]:
            return tier
    return CONFIG["reward_tiers"][-1]

def fetch_usd_krw_rate():
    fx = yf.Ticker(CONFIG["fx_ticker"])
    fx_df = fx.history(period="5d", auto_adjust=False)
    if fx_df.empty:
        raise RuntimeError("환율 데이터를 가져오지 못했습니다.")

    fx_df = fx_df.sort_index(ascending=True)
    fx_df = fx_df.dropna(subset=['Close'])
    fx_df = fx_df[fx_df['Close'] > 0]

    if fx_df.empty:
        raise RuntimeError("유효한 환율 데이터가 없습니다.")

    return float(fx_df['Close'].iloc[-1])

def fetch_and_save():
    kst_now = datetime.now(ZoneInfo("Asia/Seoul"))
    print(f"[{kst_now}] 데이터 수집 시작 (KST)...")
    
    ticker = CONFIG["ticker"]
    stock = yf.Ticker(ticker)
    df = stock.history(period="6mo", auto_adjust=False)
    
    if df.empty:
        raise RuntimeError("데이터를 가져오지 못했습니다.")

    df = df.sort_index(ascending=True)
    df = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
    df = df[(df[['Open', 'High', 'Low', 'Close']] != 0).all(axis=1)]
    df = df[df['Volume'] > 0]

    if df.empty:
        raise RuntimeError("유효한 가격/거래량 데이터가 없습니다.")

    def get_vwap_for_days(days):
        target_df = df.tail(days) if len(df) >= days else df
        return calculate_vwap(target_df)

    vwap_1w = get_vwap_for_days(5)
    vwap_1m = get_vwap_for_days(20)
    vwap_2m = get_vwap_for_days(40)
    base_price = (vwap_1w + vwap_1m + vwap_2m) / 3
    current_price = float(df['Close'].iloc[-1])
    usd_krw = fetch_usd_krw_rate()

    initial_base_price = CONFIG["initial_base_price"]
    increase_rate = ((base_price - initial_base_price) / initial_base_price) * 100

    tier = get_reward_tier(increase_rate)
    cl1_shares = round(CONFIG["base_shares"]["cl1"] * tier["payout_rate"] / 100)
    cl3_shares = round(CONFIG["base_shares"]["cl3"] * tier["payout_rate"] / 100)

    positions_data = [
        {
            "name": "CL1 / CL2",
            "shares": cl1_shares,
            "payout_rate": tier["payout_rate"],
            "estimated_reward": round(cl1_shares * current_price),
            "estimated_reward_usd": round((cl1_shares * current_price) / usd_krw, 2)
        },
        {
            "name": "CL3 / CL4",
            "shares": cl3_shares,
            "payout_rate": tier["payout_rate"],
            "estimated_reward": round(cl3_shares * current_price),
            "estimated_reward_usd": round((cl3_shares * current_price) / usd_krw, 2)
        }
    ]

    chart_df = df.tail(30)
    chart_data = []
    for index, row in chart_df.iterrows():
        chart_data.append([
            index.strftime('%m/%d'),
            round(float(row['Low'])),
            round(float(row['Open'])),
            round(float(row['Close'])),
            round(float(row['High']))
        ])

    result = {
        "stock_name": CONFIG["stock_name"],
        "ticker": ticker,
        "current_price": current_price,
        "usd_krw": round(usd_krw, 2),
        "fx_ticker": CONFIG["fx_ticker"],
        "vwap_1w": round(vwap_1w, 2),
        "vwap_1m": round(vwap_1m, 2),
        "vwap_2m": round(vwap_2m, 2),
        "base_price": round(base_price, 2),
        "initial_base_price": initial_base_price,
        "increase_rate": round(increase_rate, 2),
        "reward_tier": {
            "min_rate": tier["min_rate"],
            "payout_rate": tier["payout_rate"],
            "label_ko": tier["label_ko"],
            "label_en": tier["label_en"]
        },
        "reward_tiers": CONFIG["reward_tiers"],
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
