# Samsung PSU Calculator

A web-based tool for calculating Samsung Electronics Performance Share Unit (PSU) rewards based on real-time stock data.

## Project Overview

This project consists of a Python-based data aggregator and a static HTML frontend. It calculates the estimated PSU reward for different job levels (CL1/CL2 and CL3/CL4) by comparing the current Volume Weighted Average Price (VWAP) against an initial base price.

### Key Components

- **Frontend:** `index.html` - A single-page application using Vanilla JS, CSS, and Google Charts for visualization.
- **Data Fetcher:** `update_data.py` - A Python script using `yfinance` and `pandas` to fetch stock data for "005930.KS" (Samsung Electronics) and calculate VWAP.
- **Data Storage:** `data.json` - Stores the latest stock prices, calculated VWAP values, and reward estimations.
- **Automation:** GitHub Actions handles daily data updates via `.github/workflows/update.yml`.

## Building and Running

### Prerequisites

- Python 3.9+
- pip

### Dependencies

Install the required Python packages:
```bash
pip install -r requirements.txt
```

### Fetching Data

To manually update the stock data and rewards:
```bash
python update_data.py
```

### Running the Web Interface

Since it's a static site, you can open `index.html` directly in any web browser or serve it using a simple HTTP server:
```bash
# Example using Python's built-in server
python -m http.server 8000
```

## Development Conventions

- **Data Flow:** The Python script is the source of truth for all calculations. The frontend should only be used for presentation.
- **Styling:** Vanilla CSS is used for styling.
- **Calculations:** 
  - Base Price = (1-week VWAP + 1-month VWAP + 2-month VWAP) / 3
  - Increase Rate = ((Base Price - Initial Base Price) / Initial Base Price) * 100
  - Rewards are tiered based on the Increase Rate.
- **Automation:** Any changes to `update_data.py` should be tested locally before pushing to ensure the GitHub Action doesn't fail.
