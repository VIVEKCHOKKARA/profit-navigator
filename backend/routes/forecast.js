const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/forecast
// Fetches transactions from Supabase, sends to Python for linear regression, returns forecasts
router.post("/", async (req, res) => {
  try {
    // Fetch transactions from Supabase
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;
    if (!transactions || transactions.length === 0) {
      return res.json({ forecasts: [], historical: { months: [], revenues: [], expenses: [] } });
    }

    // Group by month
    const monthlyData = {};
    for (const t of transactions) {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      if (t.type === "income") monthlyData[month].income += Number(t.amount);
      else monthlyData[month].expense += Number(t.amount);
    }

    const months = Object.keys(monthlyData).sort();
    const revenues = months.map((m) => monthlyData[m].income);
    const expenses = months.map((m) => monthlyData[m].expense);

    // Call Python ML model
    const pythonResult = await runPythonModel({ months, revenues, expenses });

    // Save forecasts to Supabase
    const forecasts = pythonResult.forecasts;
    await supabase.from("forecasts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (forecasts.length > 0) {
      await supabase.from("forecasts").insert(forecasts);
    }

    return res.json({ forecasts, historical: { months, revenues, expenses } });
  } catch (e) {
    console.error("Forecast error:", e);
    return res.status(500).json({ error: e.message || "Forecast failed" });
  }
});

// GET /api/forecast — return saved forecasts from DB
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("forecasts")
      .select("*")
      .order("period", { ascending: true });

    if (error) throw error;
    return res.json({ forecasts: data || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

function runPythonModel(payload) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || "python";
    const scriptPath = path.join(__dirname, "../python/forecast.py");

    const proc = spawn(pythonPath, [scriptPath]);
    let stdout = "";
    let stderr = "";

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python error: ${stderr}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Invalid Python output: ${stdout}`));
      }
    });
  });
}

module.exports = router;
