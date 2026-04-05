#!/usr/bin/env python3
"""
W264 — Ads Performance Monitor
Anomaly Detection Engine using Z-Score + IQR methods
Usage: echo '{"series": [...]}' | python anomaly_detection.py
"""

import sys
import json
import math


def mean(values):
    return sum(values) / len(values) if values else 0


def std_dev(values):
    if len(values) < 2:
        return 0
    m = mean(values)
    variance = sum((v - m) ** 2 for v in values) / len(values)
    return math.sqrt(variance)


def percentile(values, p):
    sorted_vals = sorted(values)
    idx = (len(sorted_vals) - 1) * p / 100
    lower = int(idx)
    upper = lower + 1
    if upper >= len(sorted_vals):
        return sorted_vals[lower]
    frac = idx - lower
    return sorted_vals[lower] + frac * (sorted_vals[upper] - sorted_vals[lower])


def iqr_bounds(values, factor=1.5):
    q1 = percentile(values, 25)
    q3 = percentile(values, 75)
    iqr = q3 - q1
    return q1 - factor * iqr, q3 + factor * iqr


def get_recommendation(metric, direction):
    recommendations = {
        "roas":        {"down": "Review campaign budget and bid strategy",
                        "up":   "Performance spike — verify tracking accuracy"},
        "ctr":         {"down": "Refresh ad creatives and targeting",
                        "up":   "Unusual CTR spike — check for click fraud"},
        "cpc":         {"up":   "Review bidding strategy and competition",
                        "down": "CPC drop — monitor conversion quality"},
        "spend":       {"up":   "Budget cap may have been lifted unexpectedly",
                        "down": "Underspend — check budget and targeting"},
        "conversions": {"down": "Check landing page and conversion tracking",
                        "up":   "Conversion spike — verify attribution"},
        "impressions": {"down": "Check campaign status and targeting",
                        "up":   "Impression spike — review reach settings"},
        "clicks":      {"down": "Check ad delivery and targeting settings",
                        "up":   "Click spike — check for invalid traffic"},
    }
    default = "Investigate metric deviation and compare with historical data"
    return recommendations.get(metric, {}).get(direction, default)


def detect_anomalies(series):
    """
    Detect anomalies using combined Z-Score + IQR method.
    
    Input: list of { date, metric, value, campaign, platform } dicts
    Output: list of anomaly dicts with scores and recommendations
    """
    if len(series) < 3:
        return []

    values = [d["value"] for d in series]
    m      = mean(values)
    sd     = std_dev(values)
    low_iqr, high_iqr = iqr_bounds(values)

    anomalies = []

    for i, d in enumerate(series):
        v = d["value"]

        # Z-Score
        z = abs((v - m) / sd) if sd > 0 else 0

        # IQR flag
        iqr_flag = v < low_iqr or v > high_iqr

        # Combined score: average of normalized z-score and IQR flag
        combined_score = (min(z / 4.0, 1.0) + (1.0 if iqr_flag else 0.0)) / 2.0

        # Only flag if z >= 1.5 OR IQR outlier
        if z < 1.5 and not iqr_flag:
            continue

        # Determine severity
        if z >= 2.5 or (iqr_flag and z >= 2.0):
            severity = "HIGH"
        elif z >= 1.5 or iqr_flag:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        direction  = "up" if v > m else "down"
        pct_change = abs((v - m) / m * 100) if m != 0 else 0
        metric_key = d.get("metric", "unknown").lower()

        anomalies.append({
            "date":           d.get("date", ""),
            "metric":         metric_key.upper(),
            "metricKey":      metric_key,
            "campaign":       d.get("campaign", "Unknown Campaign"),
            "platform":       d.get("platform", "Unknown"),
            "value":          round(v, 4),
            "mean":           round(m, 4),
            "z_score":        round(z, 4),
            "iqr_flag":       iqr_flag,
            "severity":       severity,
            "direction":      direction,
            "pct_change":     round(pct_change, 2),
            "score":          round(combined_score, 4),
            "recommendation": get_recommendation(metric_key, direction),
            "description":    "{} {} by {:.0f}% compared to baseline (mean: {:.2f})".format(
                metric_key.upper(),
                "spiked" if direction == "up" else "dropped",
                pct_change,
                m
            ),
            "method":         "Z-Score + IQR",
        })

    # Sort by z_score descending, deduplicate by campaign+metric
    anomalies.sort(key=lambda x: x["z_score"], reverse=True)

    seen = set()
    deduped = []
    for a in anomalies:
        key = f"{a['campaign']}__{a['metric']}"
        if key not in seen:
            seen.add(key)
            deduped.append(a)

    return deduped[:20]  # max 20


if __name__ == "__main__":
    try:
        raw   = sys.stdin.read()
        data  = json.loads(raw)
        series = data.get("series", [])

        result = detect_anomalies(series)

        output = {
            "anomalies": result,
            "total":     len(result),
            "high":      sum(1 for a in result if a["severity"] == "HIGH"),
            "medium":    sum(1 for a in result if a["severity"] == "MEDIUM"),
            "low":       sum(1 for a in result if a["severity"] == "LOW"),
            "method":    "Z-Score + IQR",
        }

        print(json.dumps(output))
        sys.exit(0)

    except Exception as e:
        error = {"error": str(e), "anomalies": [], "total": 0}
        print(json.dumps(error))
        sys.exit(1)