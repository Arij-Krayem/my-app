#!/usr/bin/env python3
"""
W264 — Ads Performance Monitor
Anomaly Detection Engine using Z-Score + IQR methods
Usage (anomaly): echo '{"series": [...]}' | python anomaly_detection.py
Usage (predict): echo '{"series": [...]}' | python anomaly_detection.py --mode predict
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


# ─────────────────────────────────────────────────────────────────────────────
# PREDICTIVE BASELINE  (moving average + 7-day forecast + confidence band)
# ─────────────────────────────────────────────────────────────────────────────

def moving_average(values, window):
    """Simple moving average over a sliding window."""
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        window_vals = values[start:i + 1]
        result.append(round(mean(window_vals), 6))
    return result


def moving_stddev(values, window):
    """Rolling standard deviation over a sliding window."""
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        window_vals = values[start:i + 1]
        result.append(round(std_dev(window_vals), 6))
    return result


def next_iso_date(date_str, days_ahead):
    """Advance an ISO date string by N days without datetime module."""
    y, m, d = int(date_str[:4]), int(date_str[5:7]), int(date_str[8:10])
    days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    # leap year
    if (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0):
        days_in_month[2] = 29
    for _ in range(days_ahead):
        d += 1
        if d > days_in_month[m]:
            d = 1
            m += 1
            if m > 12:
                m = 1
                y += 1
                days_in_month[2] = 29 if (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0) else 28
    return f"{y:04d}-{m:02d}-{d:02d}"


def compute_predictive_baseline(series, window=7, forecast_days=7):
    """
    Compute moving averages and forecast next `forecast_days` values.

    Input:
        series       — list of { date, metric, value, platform? } dicts,
                       sorted oldest → newest for ONE metric + platform combo.
        window       — MA window size (default 7 days)
        forecast_days— how many future days to predict (default 7)

    Output: {
        historical : [ { date, actual, ma7, ma14, ma28, upper, lower } ],
        forecast   : [ { date, predicted, upper, lower, isPredicted: true } ],
        summary    : { lastActual, nextWeekAvg, trend, trendPct, metric, platform }
    }
    """
    if len(series) < window:
        return {"error": f"Need at least {window} data points, got {len(series)}", "historical": [], "forecast": []}

    # Sort by date ascending
    series_sorted = sorted(series, key=lambda x: x.get("date", ""))
    values = [float(d["value"]) for d in series_sorted]
    dates  = [d.get("date", "") for d in series_sorted]

    ma7  = moving_average(values, 7)
    ma14 = moving_average(values, 14)
    ma28 = moving_average(values, 28)
    sd7  = moving_stddev(values, 7)

    # Build historical rows
    historical = []
    for i, d in enumerate(series_sorted):
        upper = round(ma7[i] + sd7[i], 6)
        lower = round(ma7[i] - sd7[i], 6)
        historical.append({
            "date":   dates[i],
            "actual": round(values[i], 4),
            "ma7":    ma7[i],
            "ma14":   ma14[i],
            "ma28":   ma28[i],
            "upper":  upper,
            "lower":  max(lower, 0),  # clamp to 0 for metrics like spend/ctr
        })

    # Forecast: extend the MA using last window of actuals
    # Each predicted day feeds into the next window (recursive MA)
    forecast_values = list(values[-window:])
    forecast_sd     = sd7[-1]  # use last rolling stddev as confidence width
    forecast = []
    last_date = dates[-1]

    for day in range(1, forecast_days + 1):
        predicted = round(mean(forecast_values[-window:]), 4)
        upper     = round(predicted + forecast_sd * (1 + day * 0.05), 4)  # widen with horizon
        lower     = round(max(predicted - forecast_sd * (1 + day * 0.05), 0), 4)
        future_date = next_iso_date(last_date, day)
        forecast.append({
            "date":        future_date,
            "predicted":   predicted,
            "upper":       upper,
            "lower":       lower,
            "isPredicted": True,
        })
        forecast_values.append(predicted)

    # Summary
    last_actual   = values[-1]
    next_week_avg = round(mean([f["predicted"] for f in forecast]), 4)
    trend         = "up" if next_week_avg > last_actual else "down"
    trend_pct     = round(abs(next_week_avg - last_actual) / last_actual * 100, 2) if last_actual != 0 else 0
    metric        = series_sorted[0].get("metric", "unknown") if series_sorted else "unknown"
    platform      = series_sorted[0].get("platform", "ALL") if series_sorted else "ALL"

    return {
        "historical": historical,
        "forecast":   forecast,
        "summary": {
            "lastActual":   round(last_actual, 4),
            "nextWeekAvg":  next_week_avg,
            "trend":        trend,
            "trendPct":     trend_pct,
            "windowUsed":   window,
            "forecastDays": forecast_days,
            "metric":       metric.upper(),
            "platform":     platform,
            "dataPoints":   len(series_sorted),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mode = "anomaly"
    if "--mode" in sys.argv:
        idx  = sys.argv.index("--mode")
        mode = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else "anomaly"

    try:
        raw  = sys.stdin.read()
        data = json.loads(raw)

        if mode == "predict":
            series        = data.get("series", [])
            window        = int(data.get("window", 7))
            forecast_days = int(data.get("forecastDays", 7))

            result = compute_predictive_baseline(series, window=window, forecast_days=forecast_days)
            print(json.dumps(result))
            sys.exit(0)

        else:
            # Default: anomaly detection (unchanged)
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