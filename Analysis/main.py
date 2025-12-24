from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
import pandas as pd
import matplotlib.pyplot as plt
import base64
import io
from datetime import datetime

# ------------------- FastAPI -------------------
app = FastAPI()


# ------------------- Request Models -------------------
class ItemModel(BaseModel):
    _id: Optional[str]
    name: Optional[str]
    price: Optional[float]


class CategoryModel(BaseModel):
    _id: Optional[str]
    name: Optional[str]
    items: Optional[List[str]] = []


class TransactionModel(BaseModel):
    _id: Optional[str]
    user: Optional[str]
    category: Optional[str]
    price: Optional[float]
    text: Optional[str]
    createdAt: Optional[datetime]
    items: Optional[List[ItemModel]] = []


class TimeRange(BaseModel):
    start: Optional[datetime]
    end: Optional[datetime]


class AnalyzeRequest(BaseModel):
    user_id: Optional[str]
    transactions: List[TransactionModel] = Field(default_factory=list)
    categories: List[CategoryModel] = Field(default_factory=list)
    items: List[ItemModel] = Field(default_factory=list)
    time_range: Optional[TimeRange] = None


# ------------------- Helpers -------------------
def fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    buf.seek(0)
    img = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return img


def parse_transactions(transactions: List[Dict[str, Any]]) -> pd.DataFrame:
    if not transactions:
        return pd.DataFrame()
    df = pd.DataFrame([{
        "_id": t.get("_id") if isinstance(t, dict) else None,
        "user": t.get("user"),
        "category": t.get("category"),
        "price": float(t.get("price") or 0),
        "text": t.get("text"),
        "createdAt": pd.to_datetime(t.get("createdAt")) if t.get("createdAt") else pd.to_datetime(t.get("created_at", None)),
        "items": t.get("items", [])
    } for t in transactions])
    return df


def enrich_with_category_names(df: pd.DataFrame, categories: List[Dict[str, Any]]) -> pd.DataFrame:
    if df.empty:
        return df
    cat_df = pd.DataFrame(categories)
    if cat_df.empty:
        df["category_name"] = None
        return df
    cat_df = cat_df.rename(columns={"_id": "category"})
    merged = df.merge(cat_df[["category", "name"]], on="category", how="left")
    merged["name"] = merged["name"].fillna("Unknown")
    return merged


# ------------------- API -------------------
@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    df = parse_transactions([t.dict() if hasattr(t, "dict") else t for t in req.transactions])

    if df.empty:
        return {"message": "No transactions sent", "total_amount": 0}

    # filter by time range if provided
    if req.time_range and req.time_range.start:
        start = req.time_range.start
        df = df[df["createdAt"] >= start]
    if req.time_range and req.time_range.end:
        end = req.time_range.end
        df = df[df["createdAt"] <= end]

    # enrich with category names
    df = enrich_with_category_names(df, [c.dict() if hasattr(c, "dict") else c for c in req.categories])

    # Total amount
    total_amount = df["price"].sum()

    # Analysis over time (daily aggregation)
    df = df.sort_values("createdAt")
    df.set_index("createdAt", inplace=True)
    analysis_over_time = df["price"].resample("D").sum().fillna(0)
    analysis_over_time_json = {str(k.date()): float(v) for k, v in analysis_over_time.items()}

    # Category analysis (pie)
    category_analysis = df.groupby("name")["price"].sum().sort_values(ascending=False)
    category_analysis_json = {k: float(v) for k, v in category_analysis.items()}

    # Item-level analysis per category
    item_level = {}
    # Each transaction may contain items list
    for _, row in df.reset_index().iterrows():
        items = row.get("items") or []
        cat = row.get("name") or "Unknown"
        if cat not in item_level:
            item_level[cat] = {}
        for it in items:
            name = it.get("name") if isinstance(it, dict) else None
            if not name:
                continue
            item_level[cat][name] = item_level[cat].get(name, 0) + 1

    # Charts
    # 1) Bar chart: analysis_over_time (last 30 days for readability)
    fig1 = plt.figure(figsize=(8, 4))
    ax1 = fig1.subplots()
    analysis_over_time.tail(30).plot(kind="bar", ax=ax1)
    ax1.set_title("Spending Over Time")
    chart_all_base64 = fig_to_base64(fig1)

    # 2) Pie chart for categories
    fig2 = plt.figure(figsize=(6, 6))
    ax2 = fig2.subplots()
    if not category_analysis.empty:
        category_analysis.plot(kind="pie", autopct="%1.1f%%", ax=ax2)
    ax2.set_ylabel("")
    chart_cat_base64 = fig_to_base64(fig2)

    # 3) Bar chart for max/min category amounts
    fig3 = plt.figure(figsize=(6, 4))
    ax3 = fig3.subplots()
    if not category_analysis.empty:
        sorted_cat = category_analysis.sort_values()
        sorted_cat.plot(kind="bar", ax=ax3)
    ax3.set_title("Category Amounts")
    chart_max_min_base64 = fig_to_base64(fig3)

    return {
        "total_amount": float(total_amount),
        "analysis_over_time": analysis_over_time_json,
        "category_analysis": category_analysis_json,
        "item_level_analysis": item_level,
        "chart_all_base64": chart_all_base64,
        "chart_category_base64": chart_cat_base64,
        "chart_max_min_base64": chart_max_min_base64,
    }


# ------------------- Run Server -------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)