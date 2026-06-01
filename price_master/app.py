import streamlit as st
import pandas as pd
from src import parser, report

st.set_page_config(page_title="PriceMaster")

st.title("PriceMaster")

st.write("Upload one or more Excel files to aggregate price rows.")

uploaded_files = st.file_uploader("Choose .xlsx files", type="xlsx", accept_multiple_files=True)

if uploaded_files:
    paths = []
    # save to temp files for parser (which expects a path)
    for uf in uploaded_files:
        with open(uf.name, "wb") as f:
            f.write(uf.getbuffer())
        paths.append(uf.name)

    try:
        df = parser.parse_files(paths)
    except Exception as e:
        st.error(f"Error parsing files: {e}")
        df = pd.DataFrame()

    if not df.empty:
        st.subheader("Raw lines")
        st.dataframe(df)

        try:
            xlsx_bytes = report.export_raw_bytes(df)
            st.download_button(
                label="Download PRICE_MASTER.xlsx",
                data=xlsx_bytes,
                file_name="PRICE_MASTER.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        except Exception as e:
            st.error(f"Failed to prepare export: {e}")
    else:
        st.info("No data extracted from the files.")
