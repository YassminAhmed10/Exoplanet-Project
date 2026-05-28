# 🚀 Exoplanet Discovery & Habitability Analytics Platform

A full-scale Big Data & Machine Learning platform for analyzing real NASA exoplanet data using Apache Spark, HDFS, FastAPI, and React.

---

# 🌌 Overview

This project was developed for the **CSCI461 Big Data Course** at Nile University.

We designed and implemented an end-to-end distributed analytics platform capable of processing hundreds of thousands of astronomical observations collected across more than 30 years of space missions.

The platform combines:

* Big Data Engineering
* Distributed Processing
* Machine Learning
* Spark SQL Analytics
* Interactive Web Visualization
* Scientific Data Exploration

using real-world datasets from the NASA Exoplanet Archive.

---

# 🛰️ Dataset Information

### Source

NASA Exoplanet Archive

### Missions Included

* Kepler
* TESS
* K2

### Dataset Scale

| Metric             | Value       |
| ------------------ | ----------- |
| Number of datasets | 14          |
| Total rows         | 803,906     |
| Raw size           | 557 MB      |
| In-memory size     | ~700 MB     |
| Time span          | 1992 → 2024 |

---

# ⚙️ System Architecture

## Big Data Stack

* Apache Spark 3.5.0
* Hadoop HDFS
* Docker Compose Cluster
* PySpark
* Spark SQL

## Cluster Containers

* NameNode
* DataNode
* ResourceManager
* NodeManager
* HistoryServer
* Jupyter Notebook

## Why Apache Spark?

Traditional in-memory processing tools such as Pandas become inefficient at this scale.

Apache Spark enabled:

* Parallel distributed processing
* Fault tolerance
* Scalable transformations
* Efficient large-scale analytics

---

# 🧹 Data Engineering Pipeline

We implemented a 6-stage preprocessing pipeline using PySpark.

## Data Cleaning

* Removed uncertainty/error columns
* Dropped columns with >80% missing values
* Standardized schemas across datasets

## Missing Value Handling

| Feature Type       | Strategy          |
| ------------------ | ----------------- |
| Planetary Features | Median Imputation |
| Stellar Features   | Mean Imputation   |

## Outlier Processing

* IQR-based detection
* Factor = 3
* Winsorization instead of deletion

## Scientific Filtering

Filtered stars outside:

* 3000K → 10000K

---

# 🧠 Feature Engineering

Engineered new scientific features including:

* `planet_type`
* `stellar_class`
* `habitable_zone`
* `luminosity_proxy`
* `transit_ratio`

---

# 📊 Master DataFrames

| DataFrame      | Rows    |
| -------------- | ------- |
| Planet Master  | 58,005  |
| Stellar Master | 199,523 |
| TCE Master     | 89,090  |

---

# 🤖 Machine Learning

## 1️⃣ KOI Classification

### Goal

Predict:

* CONFIRMED
* CANDIDATE
* FALSE POSITIVE

### Model

Random Forest Classifier

### Configuration

* 200 Trees
* Max Depth = 20

### Challenge

58% class imbalance handled using weighted sampling.

### Results

| Metric   | Score  |
| -------- | ------ |
| Accuracy | 82.19% |
| F1 Score | 0.8176 |

### Most Important Feature

`koi_score`

---

## 2️⃣ Planet Type Classification

### Classes

* Rocky
* Super-Earth
* Neptune-like
* Gas Giant

### Model

Random Forest

### Important Decision

Excluded `pl_rade` to prevent data leakage.

### Results

| Metric   | Score  |
| -------- | ------ |
| Accuracy | 91.70% |
| F1 Score | 0.9168 |

### Top Feature

`pl_bmasse`

---

## 3️⃣ K-Means Clustering

### Objective

Discover natural planetary groups using unsupervised learning.

### Selection Strategy

* Elbow Method
* Silhouette Score

### Results

| Metric           | Score  |
| ---------------- | ------ |
| Silhouette Score | 0.5691 |

### Clusters Identified

| Cluster   | Description         |
| --------- | ------------------- |
| Cluster 0 | Hot Jupiters        |
| Cluster 1 | Warm Medium Planets |
| Cluster 2 | Cold Giants         |

---

# 📈 Spark SQL Insights

Key discoveries from distributed analytics:

* 74% of planets discovered using transit method
* Kepler detected 2,778 planets
* TESS detected 890 planets
* K2 detected 549 planets

## Interesting Scientific Insight

M-type (Red Dwarf) stars showed the highest habitable-zone rate, making them strong targets for future habitability research.

---

# 🌐 Web Application

## Backend

FastAPI (Python)

## Frontend

React.js + Framer Motion

## Features

* Real-time planet search
* Statistics dashboard
* Habitability explorer
* Interactive visualizations
* Space-themed UI animations

---

# 🎨 Frontend Design

Custom UI inspired by deep space visuals:

* Animated starfield
* Nebula backgrounds
* Cursor glow effects
* Responsive layout
* Smooth transitions

---

# 📂 Repository Structure

```bash
Exoplanet-Project/
│
├── backend/
├── frontend/
├── notebooks/
├── datasets/
├── spark_jobs/
├── docker/
├── models/
└── README.md
```

---

# 🛠️ Technologies Used

## Big Data

* Apache Spark
* Hadoop HDFS
* Spark SQL
* Docker

## Machine Learning

* PySpark MLlib
* Scikit-learn

## Backend

* FastAPI
* Python

## Frontend

* React.js
* Framer Motion

---

# 👩‍💻 Team

* Yassmin Ahmed
* Zeina Mohamed
* Mario Sameh
* Youssef Gallab

---

# 🎓 Academic Information

**Nile University**
Computer Science Program
Spring 2026

---

# 🙏 Special Thanks

Special thanks to:

Dr. Ebrahim Zaghloul AbdAlbaky

for the continuous support and guidance throughout this project.

---

# 🔗 Repository Link

[GitHub Repository](https://github.com/YassminAhmed10/Exoplanet-Project.git?utm_source=chatgpt.com)

---

# 📜 License

This project was developed for academic and educational purposes.
