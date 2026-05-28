from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import math
import traceback

app = FastAPI(title="Exoplanet Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load Data ──
planets_df = pd.read_csv("planets_app.csv")
koi_df     = pd.read_csv("koi_app.csv")

# Clean NaN → None
planets_df = planets_df.where(pd.notnull(planets_df), None)
koi_df     = koi_df.where(pd.notnull(koi_df), None)

print("✅ Loaded planets:", len(planets_df))
print("✅ Columns:", list(planets_df.columns))

def safe(val):
    if val is None:
        return None
    try:
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return None
    except:
        pass
    # Convert numpy types to Python native
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    return val

def get_col(row, col):
    """Safely get a column value from a row."""
    if col in row.index:
        return safe(row[col])
    return None

# ══════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════

@app.get("/")
def root():
    return {
        "message": "Exoplanet Analytics API",
        "total_planets": len(planets_df),
        "columns": list(planets_df.columns)
    }

@app.get("/planet/{name}")
def get_planet(name: str):
    try:
        result = planets_df[
            planets_df["pl_name"].str.lower() == name.lower()
        ]
        if result.empty:
            result = planets_df[
                planets_df["pl_name"].str.lower().str.contains(
                    name.lower(), na=False, regex=False
                )
            ]
        if result.empty:
            raise HTTPException(status_code=404, detail=f"Planet '{name}' not found")

        row = result.iloc[0]

        return {
            "planet": {
                "name":           get_col(row, "pl_name"),
                "type":           get_col(row, "planet_type"),
                "habitable_zone": get_col(row, "habitable_zone"),
                "orbital_period": get_col(row, "pl_orbper"),
                "radius":         get_col(row, "pl_rade"),
                "mass":           get_col(row, "pl_bmasse"),
                "temperature":    get_col(row, "pl_eqt"),
                "semi_major":     get_col(row, "pl_orbsmax"),
                "insolation":     get_col(row, "pl_insol"),
                "mass_radius":    get_col(row, "mass_radius_ratio"),
            },
            "star": {
                "name":            get_col(row, "hostname"),
                "class":           get_col(row, "stellar_class"),
                "temperature":     get_col(row, "st_teff"),
                "radius":          get_col(row, "st_rad"),
                "mass":            get_col(row, "st_mass"),
                "surface_gravity": get_col(row, "st_logg"),
                "metallicity":     get_col(row, "st_met"),
            },
            "discovery": {
                "method":      get_col(row, "discoverymethod"),
                "year":        get_col(row, "disc_year"),
                "facility":    get_col(row, "disc_facility"),
                "distance_pc": get_col(row, "sy_dist"),
                "ra":          get_col(row, "ra"),
                "dec":         get_col(row, "dec"),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
def search_planets(q: str = "", limit: int = 10):
    if not q:
        return {"results": []}
    matches = planets_df[
        planets_df["pl_name"].str.lower().str.contains(q.lower(), na=False, regex=False)
    ]["pl_name"].head(limit).tolist()
    return {"results": matches}

@app.get("/stats")
def get_stats():
    try:
        return {
            "total_planets":   int(len(planets_df)),
            "habitable":       int(planets_df["habitable_zone"].sum()),
            "planet_types":    {str(k): int(v) for k, v in planets_df["planet_type"].value_counts().items()},
            "stellar_classes": {str(k): int(v) for k, v in planets_df["stellar_class"].value_counts().items()},
            "top_facilities":  {str(k): int(v) for k, v in planets_df["disc_facility"].value_counts().head(5).items()},
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/planets")
def list_planets(limit: int = 20, offset: int = 0):
    subset = planets_df[
        ["pl_name", "planet_type", "habitable_zone", "disc_year", "disc_facility"]
    ].iloc[offset:offset+limit]
    return {
        "total":   len(planets_df),
        "planets": subset.to_dict(orient="records")
    }

@app.get("/habitable")
def get_habitable():
    try:
        result = planets_df[planets_df["habitable_zone"] == 1]
        cols = ["pl_name", "stellar_class", "pl_eqt", "pl_rade", "disc_year", "disc_facility"]
        available = [c for c in cols if c in result.columns]
        data = result[available].copy()
        # Convert NaN to None
        data = data.where(pd.notnull(data), None)
        return {
            "count":   len(result),
            "planets": data.to_dict(orient="records")
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))