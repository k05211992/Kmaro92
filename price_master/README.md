# PriceMaster

Simple local price aggregation tool built with Streamlit and pandas.

## Setup

1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\\Scripts\\activate on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the app:
   ```bash
   streamlit run app.py
   ```

## Features (MVP)

- Upload multiple Excel files (.xlsx)
- Aggregate raw price lines from all sheets and sections
- Export aggregated data to `PRICE_MASTER.xlsx` with a `RAW_LINES` sheet

Future:

- Normalization dictionaries
- Price list calculations and QC
- Data quality checks and reports
