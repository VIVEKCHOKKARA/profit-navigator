"""
Linear Regression forecast model for Profit Navigator.
Reads JSON from stdin: { months, revenues, expenses }
Writes JSON to stdout: { forecasts: [...] }
"""

import sys
import json
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

try:
    import numpy as np
    from sklearn.linear_model import LinearRegression
except ImportError:
    sys.stderr.write("Missing dependencies. Run: pip install numpy scikit-learn python-dateutil\n")
    sys.exit(1)


def linear_regression_forecast(values: list[float], future_count: int = 6):
    """Fit a linear regression model and predict future values."""
    n = len(values)
    if n < 2:
        intercept = values[0] if values else 0
        return [max(0, round(intercept)) for _ in range(future_count)], 0.0

    X = np.arange(n).reshape(-1, 1)
    y = np.array(values)

    model = LinearRegression()
    model.fit(X, y)

    r2 = float(model.score(X, y))

    future_X = np.arange(n, n + future_count).reshape(-1, 1)
    predictions = model.predict(future_X)
    predictions = [max(0, round(float(p))) for p in predictions]

    return predictions, r2


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw)

    months: list[str] = payload["months"]       # ["2024-01", "2024-02", ...]
    revenues: list[float] = payload["revenues"]
    expenses: list[float] = payload["expenses"]

    future_count = 6

    rev_predictions, rev_r2 = linear_regression_forecast(revenues, future_count)
    exp_predictions, _ = linear_regression_forecast(expenses, future_count)

    # Determine start date for forecasts
    if months:
        last_month = datetime.strptime(months[-1], "%Y-%m")
    else:
        last_month = datetime.now().replace(day=1)

    forecasts = []
    for i in range(future_count):
        future_date = last_month + relativedelta(months=i + 1)
        period = future_date.strftime("%b %y")   # e.g. "Jan 25"
        confidence = round(max(0.5, 0.95 - i * 0.05) * rev_r2, 4)

        forecasts.append({
            "period": period,
            "predicted_revenue": rev_predictions[i],
            "predicted_expenses": exp_predictions[i],
            "confidence": confidence,
        })

    print(json.dumps({"forecasts": forecasts}))


if __name__ == "__main__":
    main()
