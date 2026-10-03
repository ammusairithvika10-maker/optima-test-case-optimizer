import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Database,
  Zap,
  Target,
  Plus,
  Trash2,
  Clock,
  ShieldAlert,
  Layers3,
  ArrowDownUp,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Grid3X3,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import "../index.css";

function Engine() {
  const [testCases, setTestCases] = useState([]);

  const [form, setForm] = useState({
    name: "",
    topic: "",
    edgeCase: "No",
    time: "",
    priority: "",
  });

  /* SORTING */

  const [sortCriteria, setSortCriteria] = useState("priority");
  const [sortedCases, setSortedCases] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [comparisons, setComparisons] = useState(0);
  const [sortTime, setSortTime] = useState(0);

  /* GREEDY */

  const [budget, setBudget] = useState(6);
  const [greedyResults, setGreedyResults] = useState([]);
  const [greedyRunning, setGreedyRunning] = useState(false);
  const [greedyTime, setGreedyTime] = useState(0);

  /* KNAPSACK */

  const [knapsackResults, setKnapsackResults] = useState([]);
  const [knapsackRunning, setKnapsackRunning] = useState(false);
  const [knapsackTime, setKnapsackTime] = useState(0);
  const [knapsackValue, setKnapsackValue] = useState(0);
  const [knapsackCost, setKnapsackCost] = useState(0);
  const [dpRows, setDpRows] = useState([]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* =====================================================
     BACKEND / SQLITE CONNECTION
     ===================================================== */

  const API_URL = "http://127.0.0.1:5000/api/test-cases";

  // Load saved test cases from Flask + SQLite
  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load test cases");
      }

      const data = await response.json();

      const formattedCases = data.map((item) => ({
        backendId: item.id,
        id: `TC${String(item.id).padStart(2, "0")}`,
        name: item.name,
        topic: item.topic,
        edgeCase: item.edge_case,
        time: Number(item.execution_time),
        priority: Number(item.priority),
      }));

      setTestCases(formattedCases);
    } catch (error) {
      console.error("Backend connection failed:", error);
    }
  };


  /* ADD TEST CASE */

  const addTestCase = async () => {
    if (
      !form.name ||
      !form.topic ||
      !form.time ||
      !form.priority
    ) {
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          topic: form.topic,
          edgeCase: form.edgeCase,
          time: Number(form.time),
          priority: Number(form.priority),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add test case");
      }

      await loadTestCases();

      setForm({
        name: "",
        topic: "",
        edgeCase: "No",
        time: "",
        priority: "",
      });

      setSortedCases([]);
      setGreedyResults([]);
      setKnapsackResults([]);
      setDpRows([]);
    } catch (error) {
      console.error("Failed to add test case:", error);
    }
  };


  /* DELETE */

  const deleteTestCase = async (id) => {
    const testCase = testCases.find(
      (item) => item.id === id
    );

    if (!testCase) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${testCase.backendId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete test case");
      }

      await loadTestCases();

      setSortedCases(
        sortedCases.filter(
          (item) => item.id !== id
        )
      );

      setGreedyResults(
        greedyResults.filter(
          (item) => item.id !== id
        )
      );

      setKnapsackResults(
        knapsackResults.filter(
          (item) => item.id !== id
        )
      );

      setDpRows([]);
    } catch (error) {
      console.error("Failed to delete test case:", error);
    }
  };

  /* SORT VALUE */

  const getValue = (item) => {
    if (sortCriteria === "priority") {
      return item.priority;
    }

    if (sortCriteria === "time") {
      return item.time;
    }

    return item.priority / item.time;
  };

  /* SORTING */

  const runSorting = () => {
    if (testCases.length < 2) {
      setSortedCases([...testCases]);
      return;
    }

    setSorting(true);
    setComparisons(0);

    const start = performance.now();

    let arr = [...testCases];
    let count = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        count++;

        const first = getValue(arr[j]);
        const second = getValue(arr[j + 1]);

        let shouldSwap;

        if (sortCriteria === "time") {
          shouldSwap = first > second;
        } else {
          shouldSwap = first < second;
        }

        if (shouldSwap) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
      }
    }

    const end = performance.now();

    setComparisons(count);
    setSortTime((end - start).toFixed(3));

    setSortedCases([]);

    setTimeout(() => {
      setSorting(false);

      arr.forEach((item, index) => {
        setTimeout(() => {
          setSortedCases((previous) => [
            ...previous,
            item,
          ]);
        }, index * 180);
      });
    }, 500);
  };

  const resetSorting = () => {
    setSortedCases([]);
    setComparisons(0);
    setSortTime(0);
    setSorting(false);
  };

  /* =====================================================
     GREEDY
     ===================================================== */

  const calculateEfficiency = (item) => {
    return item.priority / item.time;
  };

  const runGreedy = () => {
    if (testCases.length === 0) {
      return;
    }

    setGreedyRunning(true);
    setGreedyResults([]);

    const start = performance.now();

    const candidates = [...testCases].sort(
      (a, b) =>
        calculateEfficiency(b) -
        calculateEfficiency(a)
    );

    let remainingBudget = Number(budget);
    const decisions = [];

    candidates.forEach((item) => {
      const efficiency = calculateEfficiency(item);

      if (item.time <= remainingBudget) {
        remainingBudget -= item.time;

        decisions.push({
          ...item,
          efficiency: efficiency.toFixed(2),
          decision: "SELECTED",
          reason:
            "Highest value-to-cost ratio among the remaining feasible test cases.",
        });
      } else {
        decisions.push({
          ...item,
          efficiency: efficiency.toFixed(2),
          decision: "REJECTED",
          reason:
            "Execution time exceeds the remaining budget.",
        });
      }
    });

    const end = performance.now();

    setGreedyTime((end - start).toFixed(3));

    setTimeout(() => {
      setGreedyRunning(false);

      decisions.forEach((item, index) => {
        setTimeout(() => {
          setGreedyResults((previous) => [
            ...previous,
            item,
          ]);
        }, index * 300);
      });
    }, 400);
  };

  const resetGreedy = () => {
    setGreedyResults([]);
    setGreedyRunning(false);
    setGreedyTime(0);
  };

  const selectedCases = greedyResults.filter(
    (item) => item.decision === "SELECTED"
  );

  const rejectedCases = greedyResults.filter(
    (item) => item.decision === "REJECTED"
  );

  const selectedTime = selectedCases.reduce(
    (sum, item) => sum + item.time,
    0
  );

  const selectedValue = selectedCases.reduce(
    (sum, item) => sum + item.priority,
    0
  );

  /* =====================================================
     KNAPSACK - 0/1 DYNAMIC PROGRAMMING
     ===================================================== */

  const runKnapsack = () => {
    if (testCases.length === 0) {
      return;
    }

    setKnapsackRunning(true);
    setKnapsackResults([]);
    setDpRows([]);

    const start = performance.now();

    const capacity = Number(budget);
    const n = testCases.length;

    /*
      dp[i][w] =
      maximum priority value using first i
      test cases with maximum time w.
    */

    const dp = Array.from(
      { length: n + 1 },
      () => Array(capacity + 1).fill(0)
    );

    for (let i = 1; i <= n; i++) {
      const current = testCases[i - 1];

      for (let w = 0; w <= capacity; w++) {
        if (current.time <= w) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            current.priority +
              dp[i - 1][w - current.time]
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    /* RECONSTRUCT OPTIMAL SET */

    let w = capacity;
    const selected = [];

    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.push(testCases[i - 1]);
        w -= testCases[i - 1].time;
      }
    }

    selected.reverse();

    const selectedIds = new Set(
      selected.map((item) => item.id)
    );

    const results = testCases.map((item) => ({
      ...item,
      decision: selectedIds.has(item.id)
        ? "SELECTED"
        : "REJECTED",
    }));

    const totalValue = selected.reduce(
      (sum, item) => sum + item.priority,
      0
    );

    const totalCost = selected.reduce(
      (sum, item) => sum + item.time,
      0
    );

    const end = performance.now();

    setKnapsackTime((end - start).toFixed(3));
    setKnapsackValue(totalValue);
    setKnapsackCost(totalCost);

    /*
      Display compact DP rows for visualization.
    */

    const rows = dp.map((row, index) => ({
      id:
        index === 0
          ? "BASE"
          : testCases[index - 1].id,
      values: row,
    }));

    setDpRows(rows);

    setTimeout(() => {
      setKnapsackRunning(false);

      results.forEach((item, index) => {
        setTimeout(() => {
          setKnapsackResults((previous) => [
            ...previous,
            item,
          ]);
        }, index * 280);
      });
    }, 500);
  };

  const resetKnapsack = () => {
    setKnapsackResults([]);
    setKnapsackRunning(false);
    setKnapsackTime(0);
    setKnapsackValue(0);
    setKnapsackCost(0);
    setDpRows([]);
  };

  const knapsackSelected = knapsackResults.filter(
    (item) => item.decision === "SELECTED"
  );

  const knapsackRejected = knapsackResults.filter(
    (item) => item.decision === "REJECTED"
  );


  /* =====================================================
     GREEDY vs KNAPSACK COMPARISON
     ===================================================== */

  const comparisonGreedyValue = selectedValue;
  const comparisonGreedyTime = selectedTime;
  const comparisonKnapsackValue = knapsackValue;
  const comparisonKnapsackTime = knapsackCost;

  const valueDifference =
    comparisonKnapsackValue - comparisonGreedyValue;

  const timeDifference =
    comparisonKnapsackTime - comparisonGreedyTime;

  const comparisonReady =
    greedyResults.length > 0 && knapsackResults.length > 0;

  /* =====================================================
     COVERAGE ANALYSIS
     ===================================================== */

  const allTopics = [
    ...new Set(testCases.map((item) => item.topic)),
  ];

  const allEdgeCases = testCases.filter(
    (item) => item.edgeCase === "Yes"
  );

  const getCoverageData = (selectedItems) => {
    const coveredTopics = [
      ...new Set(selectedItems.map((item) => item.topic)),
    ];

    const coveredEdgeCases = selectedItems.filter(
      (item) => item.edgeCase === "Yes"
    );

    const topicCoverage =
      allTopics.length === 0
        ? 0
        : Math.round(
            (coveredTopics.length / allTopics.length) * 100
          );

    const edgeCoverage =
      allEdgeCases.length === 0
        ? 0
        : Math.round(
            (coveredEdgeCases.length / allEdgeCases.length) * 100
          );

    const overallCoverage =
      allTopics.length === 0 && allEdgeCases.length === 0
        ? 0
        : Math.round((topicCoverage + edgeCoverage) / 2);

    const uncoveredTopics = allTopics.filter(
      (topic) => !coveredTopics.includes(topic)
    );

    const uncoveredEdgeCases = allEdgeCases.filter(
      (item) =>
        !selectedItems.some(
          (selected) => selected.id === item.id
        )
    );

    return {
      coveredTopics,
      coveredEdgeCases,
      topicCoverage,
      edgeCoverage,
      overallCoverage,
      uncoveredTopics,
      uncoveredEdgeCases,
    };
  };

  const greedyCoverage = getCoverageData(selectedCases);
  const knapsackCoverage = getCoverageData(knapsackSelected);

  const coverageReady =
    greedyResults.length > 0 || knapsackResults.length > 0;

  /* =====================================================
     ANALYTICS + EXPORT
     ===================================================== */

  const totalExecutionTime = testCases.reduce(
    (sum, item) => sum + Number(item.time),
    0
  );

  const averagePriority = testCases.length === 0
    ? 0
    : (testCases.reduce((sum, item) => sum + Number(item.priority), 0) / testCases.length).toFixed(1);

  const topicCounts = allTopics.map((topic) => ({
    topic,
    count: testCases.filter((item) => item.topic === topic).length,
  }));

  const maxTopicCount = Math.max(
    1,
    ...topicCounts.map((item) => item.count)
  );

  const exportExcel = () => {
    const rows = [
      ["OPTIMA - TEST CASE OPTIMIZATION REPORT"],
      [],
      ["Metric", "Value"],
      ["Total Test Cases", testCases.length],
      ["Total Topics", allTopics.length],
      ["Edge Cases", allEdgeCases.length],
      ["Execution Time Budget", `${budget}s`],
      ["Total Execution Time", `${totalExecutionTime}s`],
      ["Average Priority", averagePriority],
      ["Greedy Value", selectedValue],
      ["Greedy Time", `${selectedTime}s`],
      ["Knapsack Value", knapsackValue],
      ["Knapsack Time", `${knapsackCost}s`],
      ["Value Difference", valueDifference],
      [],
      ["Test Case ID", "Name", "Topic", "Edge Case", "Time (s)", "Priority"],
      ...testCases.map((item) => [
        item.id,
        item.name,
        item.topic,
        item.edgeCase,
        item.time,
        item.priority,
      ]),
      [],
      ["GREEDY SELECTED CASES"],
      ["ID", "Name", "Topic", "Time", "Priority"],
      ...selectedCases.map((item) => [
        item.id,
        item.name,
        item.topic,
        item.time,
        item.priority,
      ]),
      [],
      ["KNAPSACK SELECTED CASES"],
      ["ID", "Name", "Topic", "Time", "Priority"],
      ...knapsackSelected.map((item) => [
        item.id,
        item.name,
        item.topic,
        item.time,
        item.priority,
      ]),
    ];

    const escapeCell = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const tableRows = rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${escapeCell(cell)}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const excelHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial; }
            td { border: 1px solid #999; padding: 7px; }
            tr:first-child td { font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <table>${tableRows}</table>
        </body>
      </html>`;

    const blob = new Blob([excelHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "OPTIMA_Optimization_Report.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const popup = window.open("", "_blank", "width=1000,height=800");

    if (!popup) {
      alert("Please allow pop-ups to export the PDF report.");
      return;
    }

    const selectedGreedy = selectedCases.map((item) => item.id).join(", ") || "None";
    const selectedKnapsack = knapsackSelected.map((item) => item.id).join(", ") || "None";

    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPTIMA Optimization Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #111827;
          }
          h1 { margin-bottom: 4px; }
          h2 {
            margin-top: 28px;
            border-bottom: 2px solid #111827;
            padding-bottom: 6px;
          }
          .subtitle { color: #6b7280; margin-bottom: 25px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .card {
            border: 1px solid #d1d5db;
            padding: 14px;
            border-radius: 8px;
          }
          .label { font-size: 11px; color: #6b7280; }
          .value { font-size: 22px; font-weight: bold; margin-top: 5px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          th { background: #f3f4f6; }
          .footer {
            margin-top: 35px;
            font-size: 11px;
            color: #6b7280;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>OPTIMA</h1>
        <div class="subtitle">Intelligent Test-Case Optimization & Coverage Engine</div>

        <div class="grid">
          <div class="card"><div class="label">TEST CASES</div><div class="value">${testCases.length}</div></div>
          <div class="card"><div class="label">TOPICS</div><div class="value">${allTopics.length}</div></div>
          <div class="card"><div class="label">EDGE CASES</div><div class="value">${allEdgeCases.length}</div></div>
          <div class="card"><div class="label">BUDGET</div><div class="value">${budget}s</div></div>
        </div>

        <h2>Optimization Summary</h2>
        <table>
          <tr><th>Metric</th><th>Greedy</th><th>Knapsack</th></tr>
          <tr><td>Total Value</td><td>${selectedValue}</td><td>${knapsackValue}</td></tr>
          <tr><td>Time Used</td><td>${selectedTime}s</td><td>${knapsackCost}s</td></tr>
          <tr><td>Selected Cases</td><td>${selectedCases.length}</td><td>${knapsackSelected.length}</td></tr>
          <tr><td>Coverage</td><td>${greedyCoverage.overallCoverage}%</td><td>${knapsackCoverage.overallCoverage}%</td></tr>
        </table>

        <h2>Test Case Repository</h2>
        <table>
          <tr><th>ID</th><th>Name</th><th>Topic</th><th>Edge Case</th><th>Time</th><th>Priority</th></tr>
          ${testCases.map((item) => `
            <tr>
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${item.topic}</td>
              <td>${item.edgeCase}</td>
              <td>${item.time}s</td>
              <td>${item.priority}</td>
            </tr>`).join("")}
        </table>

        <h2>Selected Test Cases</h2>
        <p><strong>Greedy:</strong> ${selectedGreedy}</p>
        <p><strong>Knapsack:</strong> ${selectedKnapsack}</p>

        <h2>Complexity</h2>
        <table>
          <tr><th>Algorithm</th><th>Complexity</th></tr>
          <tr><td>Bubble Sort</td><td>O(n²)</td></tr>
          <tr><td>Greedy</td><td>O(n log n)</td></tr>
          <tr><td>0/1 Knapsack</td><td>O(n × B)</td></tr>
        </table>

        <div class="footer">Generated by OPTIMA • Test-Case Optimization & Coverage Engine</div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    popup.document.close();
  };

  return (
    <div className="engine-page">

      {/* HEADER */}

      <header className="engine-header">

        <div className="engine-logo">
          OPTIMA
        </div>

        <div className="engine-status">
          <span></span>
          ENGINE ONLINE
        </div>

        <div className="engine-time">
          OPTIMIZATION CORE
        </div>

      </header>


      {/* MAIN */}

      <main className="engine-main">

        {/* LEFT PIPELINE */}

        <aside className="input-panel">

          <div className="panel-title">
            INPUT PIPELINE
          </div>

          <div className="pipeline">

            <div className="pipeline-item active">
              <Database size={16} />

              <div>
                <strong>TEST CASES</strong>
                <small>
                  {testCases.length} cases loaded
                </small>
              </div>
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-item">
              <Target size={16} />

              <div>
                <strong>TOPICS</strong>
                <small>
                  Coverage mapping
                </small>
              </div>
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-item">
              <Activity size={16} />

              <div>
                <strong>EDGE CASES</strong>
                <small>
                  Coverage analysis
                </small>
              </div>
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-item">
              <Zap size={16} />

              <div>
                <strong>TIME BUDGET</strong>
                <small>
                  Execution constraint
                </small>
              </div>
            </div>

          </div>

        </aside>


        {/* CENTER */}

        <section className="algorithm-core">

          {/* STEP 01 */}

          <div className="core-heading">
            <span>01</span>
            TEST CASE INPUT
          </div>


          <motion.div
            className="input-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <div className="input-card-title">
              <Plus size={18} />
              ADD TEST CASE
            </div>


            <div className="form-grid">

              <div className="field">
                <label>TEST CASE NAME</label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Login with valid credentials"
                />
              </div>


              <div className="field">
                <label>TOPIC</label>

                <input
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  placeholder="e.g. Authentication"
                />
              </div>


              <div className="field">
                <label>EDGE CASE</label>

                <select
                  name="edgeCase"
                  value={form.edgeCase}
                  onChange={handleChange}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>


              <div className="field">
                <label>EXECUTION TIME (SEC)</label>

                <input
                  type="number"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                  min="1"
                />
              </div>


              <div className="field">
                <label>PRIORITY</label>

                <input
                  type="number"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  placeholder="1 - 10"
                  min="1"
                  max="10"
                />
              </div>

            </div>


            <button
              className="add-case-btn"
              onClick={addTestCase}
            >
              <Plus size={18} />
              ADD TEST CASE
            </button>

          </motion.div>


          {/* STEP 02 */}

          <div className="repository-section">

            <div className="repository-header">

              <div>
                <span>02</span>
                TEST CASE REPOSITORY
              </div>

              <div className="case-count">
                {testCases.length} CASES
              </div>

            </div>


            {testCases.length === 0 ? (

              <div className="empty-repository">

                <Database size={35} />

                <strong>
                  NO TEST CASES LOADED
                </strong>

                <span>
                  Add test cases to begin optimization
                </span>

              </div>

            ) : (

              <div className="test-case-list">

                {testCases.map((testCase, index) => (

                  <motion.div
                    className="test-case-card"
                    key={testCase.id}
                    initial={{
                      opacity: 0,
                      x: -30,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: index * 0.05,
                    }}
                  >

                    <div className="case-id">
                      {testCase.id}
                    </div>

                    <div className="case-main">

                      <strong>
                        {testCase.name}
                      </strong>

                      <div className="case-tags">

                        <span>
                          <Layers3 size={13} />
                          {testCase.topic}
                        </span>

                        {testCase.edgeCase === "Yes" && (
                          <span className="edge-tag">
                            <ShieldAlert size={13} />
                            EDGE CASE
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="case-stat">

                      <small>TIME</small>

                      <strong>
                        <Clock size={13} />
                        {testCase.time}s
                      </strong>

                    </div>

                    <div className="case-stat">

                      <small>PRIORITY</small>

                      <strong>
                        {testCase.priority}
                      </strong>

                    </div>

                    <button
                      className="delete-case"
                      onClick={() =>
                        deleteTestCase(testCase.id)
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                  </motion.div>

                ))}

              </div>

            )}

          </div>


          {/* STEP 03 SORTING */}

          <div className="sorting-section">

            <div className="core-heading">
              <span>03</span>
              SORTING ENGINE
            </div>


            <div className="sorting-control">

              <div className="sorting-select">

                <ArrowDownUp size={18} />

                <div>

                  <label>
                    SORTING CRITERIA
                  </label>

                  <select
                    value={sortCriteria}
                    onChange={(e) => {
                      setSortCriteria(e.target.value);
                      resetSorting();
                    }}
                  >

                    <option value="priority">
                      PRIORITY — HIGH TO LOW
                    </option>

                    <option value="time">
                      EXECUTION TIME — LOW TO HIGH
                    </option>

                    <option value="efficiency">
                      EFFICIENCY — PRIORITY / TIME
                    </option>

                  </select>

                </div>

              </div>


              <div className="sorting-buttons">

                <button
                  className="run-sort-btn"
                  onClick={runSorting}
                  disabled={
                    sorting ||
                    testCases.length === 0
                  }
                >
                  <Play size={16} />

                  {sorting
                    ? "SORTING..."
                    : "RUN SORTING"}
                </button>


                <button
                  className="reset-sort-btn"
                  onClick={resetSorting}
                >
                  <RotateCcw size={15} />
                </button>

              </div>

            </div>


            <div className="sorting-stats">

              <div>
                <span>ALGORITHM</span>
                <strong>BUBBLE SORT</strong>
              </div>

              <div>
                <span>COMPARISONS</span>
                <strong>{comparisons}</strong>
              </div>

              <div>
                <span>EXECUTION</span>
                <strong>{sortTime} ms</strong>
              </div>

              <div>
                <span>COMPLEXITY</span>
                <strong>O(n²)</strong>
              </div>

            </div>


            <div className="sorted-result">

              <div className="sorted-title">
                SORTED RANKING
              </div>


              {sortedCases.length === 0 ? (

                <div className="sorting-empty">

                  <ArrowDownUp size={28} />

                  <span>
                    Run sorting to generate ranking
                  </span>

                </div>

              ) : (

                <div className="sorted-list">

                  <AnimatePresence>

                    {sortedCases.map(
                      (testCase, index) => (

                        <motion.div
                          key={testCase.id}
                          className="sorted-card"
                          initial={{
                            opacity: 0,
                            x: -40,
                            scale: 0.95,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                          }}
                        >

                          <div className="rank">
                            #{index + 1}
                          </div>

                          <div className="sorted-name">

                            <strong>
                              {testCase.id}
                            </strong>

                            <span>
                              {testCase.name}
                            </span>

                          </div>

                          <div className="sorted-topic">
                            {testCase.topic}
                          </div>

                          <div className="sorted-value">

                            <small>
                              {sortCriteria === "priority"
                                ? "PRIORITY"
                                : sortCriteria === "time"
                                ? "TIME"
                                : "EFFICIENCY"}
                            </small>

                            <strong>
                              {sortCriteria ===
                              "efficiency"
                                ? (
                                    testCase.priority /
                                    testCase.time
                                  ).toFixed(2)
                                : getValue(testCase)}
                            </strong>

                          </div>

                        </motion.div>

                      )
                    )}

                  </AnimatePresence>

                </div>

              )}

            </div>

          </div>


          {/* STEP 04 GREEDY */}

          <div className="greedy-section">

            <div className="core-heading">
              <span>04</span>
              GREEDY OPTIMIZER
            </div>


            <div className="greedy-control">

              <div className="budget-control">

                <Clock size={19} />

                <div>

                  <label>
                    EXECUTION TIME BUDGET
                  </label>

                  <div className="budget-input-row">

                    <input
                      type="number"
                      min="1"
                      value={budget}
                      onChange={(e) =>
                        setBudget(e.target.value)
                      }
                    />

                    <span>
                      SECONDS
                    </span>

                  </div>

                </div>

              </div>


              <div className="greedy-actions">

                <button
                  className="run-greedy-btn"
                  onClick={runGreedy}
                  disabled={
                    greedyRunning ||
                    testCases.length === 0
                  }
                >

                  <BrainCircuit size={17} />

                  {greedyRunning
                    ? "OPTIMIZING..."
                    : "RUN GREEDY"}

                </button>


                <button
                  className="reset-sort-btn"
                  onClick={resetGreedy}
                >
                  <RotateCcw size={15} />
                </button>

              </div>

            </div>


            <div className="greedy-stats">

              <div>
                <span>STRATEGY</span>
                <strong>
                  VALUE / COST
                </strong>
              </div>

              <div>
                <span>SELECTED</span>
                <strong>
                  {selectedCases.length}
                </strong>
              </div>

              <div>
                <span>TOTAL VALUE</span>
                <strong>
                  {selectedValue}
                </strong>
              </div>

              <div>
                <span>TIME USED</span>
                <strong>
                  {selectedTime}s
                </strong>
              </div>

            </div>


            <div className="greedy-trace">

              <div className="greedy-trace-header">

                <div>
                  <span>DECISION TRACE</span>

                  <small>
                    GREEDY SELECTION PROCESS
                  </small>
                </div>

                <div className="greedy-time">
                  {greedyTime} ms
                </div>

              </div>


              {greedyResults.length === 0 ? (

                <div className="greedy-empty">

                  <BrainCircuit size={32} />

                  <strong>
                    WAITING FOR OPTIMIZATION
                  </strong>

                  <span>
                    Set a time budget and run the
                    greedy algorithm
                  </span>

                </div>

              ) : (

                <div className="greedy-list">

                  <AnimatePresence>

                    {greedyResults.map((item) => (

                      <motion.div
                        key={item.id}
                        className={`greedy-card ${
                          item.decision === "SELECTED"
                            ? "selected-card"
                            : "rejected-card"
                        }`}
                        initial={{
                          opacity: 0,
                          x: -30,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                      >

                        <div className="greedy-status">

                          {item.decision ===
                          "SELECTED" ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <XCircle size={20} />
                          )}

                        </div>

                        <div className="greedy-id">
                          {item.id}
                        </div>

                        <div className="greedy-info">

                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.topic}
                          </span>

                        </div>

                        <div className="greedy-ratio">

                          <small>
                            VALUE / COST
                          </small>

                          <strong>
                            {item.efficiency}
                          </strong>

                        </div>

                        <div className="greedy-cost">

                          <small>
                            TIME
                          </small>

                          <strong>
                            {item.time}s
                          </strong>

                        </div>

                        <div
                          className={`decision-label ${
                            item.decision === "SELECTED"
                              ? "decision-selected"
                              : "decision-rejected"
                          }`}
                        >
                          {item.decision}
                        </div>

                        <div className="greedy-reason">

                          <small>WHY?</small>

                          <span>
                            {item.reason}
                          </span>

                        </div>

                      </motion.div>

                    ))}

                  </AnimatePresence>

                </div>

              )}

            </div>

          </div>


          {/* STEP 05 KNAPSACK */}

          <div className="knapsack-section">

            <div className="core-heading">
              <span>05</span>
              KNAPSACK OPTIMIZER
            </div>


            <div className="knapsack-control">

              <div className="knapsack-info">

                <Grid3X3 size={19} />

                <div>
                  <label>
                    OPTIMIZATION MODEL
                  </label>

                  <strong>
                    0/1 KNAPSACK — DYNAMIC PROGRAMMING
                  </strong>

                  <small>
                    Maximize priority value within
                    execution-time budget
                  </small>
                </div>

              </div>


              <div className="greedy-actions">

                <button
                  className="run-greedy-btn"
                  onClick={runKnapsack}
                  disabled={
                    knapsackRunning ||
                    testCases.length === 0
                  }
                >

                  <Grid3X3 size={17} />

                  {knapsackRunning
                    ? "SOLVING..."
                    : "RUN KNAPSACK"}

                </button>


                <button
                  className="reset-sort-btn"
                  onClick={resetKnapsack}
                >
                  <RotateCcw size={15} />
                </button>

              </div>

            </div>


            {/* KNAPSACK STATS */}

            <div className="knapsack-stats">

              <div>
                <span>ALGORITHM</span>
                <strong>
                  0/1 KNAPSACK
                </strong>
              </div>

              <div>
                <span>OPTIMAL VALUE</span>
                <strong>
                  {knapsackValue}
                </strong>
              </div>

              <div>
                <span>TIME USED</span>
                <strong>
                  {knapsackCost}s
                </strong>
              </div>

              <div>
                <span>EXECUTION</span>
                <strong>
                  {knapsackTime} ms
                </strong>
              </div>

            </div>


            {/* DP TABLE */}

            <div className="dp-panel">

              <div className="dp-header">

                <div>
                  <span>01</span>
                  DYNAMIC PROGRAMMING TABLE
                </div>

                <small>
                  CAPACITY: {budget}s
                </small>

              </div>


              {dpRows.length === 0 ? (

                <div className="dp-empty">

                  <Grid3X3 size={30} />

                  <strong>
                    DP TABLE NOT GENERATED
                  </strong>

                  <span>
                    Run Knapsack to build the
                    optimization matrix
                  </span>

                </div>

              ) : (

                <div className="dp-table-wrapper">

                  <table className="dp-table">

                    <thead>

                      <tr>

                        <th>
                          CASE
                        </th>

                        {Array.from(
                          {
                            length:
                              Number(budget) + 1,
                          },
                          (_, index) => (
                            <th key={index}>
                              {index}
                            </th>
                          )
                        )}

                      </tr>

                    </thead>


                    <tbody>

                      {dpRows.map((row) => (

                        <tr key={row.id}>

                          <td className="dp-case">
                            {row.id}
                          </td>

                          {row.values.map(
                            (value, index) => (

                              <td
                                key={index}
                                className={
                                  value > 0
                                    ? "dp-filled"
                                    : ""
                                }
                              >
                                {value}
                              </td>

                            )
                          )}

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>


            {/* KNAPSACK RESULT */}

            <div className="knapsack-result">

              <div className="knapsack-result-header">

                <div>
                  <span>02</span>
                  OPTIMAL SELECTION
                </div>

                <small>
                  {knapsackSelected.length} SELECTED
                </small>

              </div>


              {knapsackResults.length === 0 ? (

                <div className="knapsack-empty">

                  <Grid3X3 size={30} />

                  <strong>
                    WAITING FOR OPTIMAL SOLUTION
                  </strong>

                  <span>
                    Run the Knapsack algorithm
                  </span>

                </div>

              ) : (

                <div className="knapsack-list">

                  <AnimatePresence>

                    {knapsackResults.map((item) => (

                      <motion.div
                        key={item.id}
                        className={`knapsack-card ${
                          item.decision === "SELECTED"
                            ? "knapsack-selected"
                            : "knapsack-rejected"
                        }`}
                        initial={{
                          opacity: 0,
                          x: -30,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                      >

                        <div className="knapsack-status">

                          {item.decision ===
                          "SELECTED" ? (
                            <CheckCircle2 size={19} />
                          ) : (
                            <XCircle size={19} />
                          )}

                        </div>

                        <div className="knapsack-id">
                          {item.id}
                        </div>

                        <div className="knapsack-name">

                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.topic}
                          </span>

                        </div>

                        <div className="knapsack-value">

                          <small>
                            VALUE
                          </small>

                          <strong>
                            {item.priority}
                          </strong>

                        </div>

                        <div className="knapsack-value">

                          <small>
                            COST
                          </small>

                          <strong>
                            {item.time}s
                          </strong>

                        </div>

                        <div
                          className={`decision-label ${
                            item.decision === "SELECTED"
                              ? "decision-selected"
                              : "decision-rejected"
                          }`}
                        >
                          {item.decision}
                        </div>

                      </motion.div>

                    ))}

                  </AnimatePresence>

                </div>

              )}

            </div>

          </div>


          {/* STEP 06 GREEDY vs KNAPSACK COMPARISON */}

          <div className="comparison-section">
            <div className="core-heading">
              <span>06</span>
              GREEDY vs KNAPSACK
            </div>

            {!comparisonReady ? (
              <div className="comparison-empty">
                <Activity size={30} />
                <strong>COMPARISON WAITING</strong>
                <span>
                  Run both Greedy and Knapsack to compare their results.
                </span>
              </div>
            ) : (
              <>
                <div className="comparison-grid">

                  <motion.div
                    className="comparison-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="comparison-card-header">
                      <BrainCircuit size={20} />
                      <span>GREEDY</span>
                    </div>

                    <div className="comparison-stat">
                      <small>SELECTED CASES</small>
                      <strong>{selectedCases.length}</strong>
                    </div>

                    <div className="comparison-stat">
                      <small>TOTAL VALUE</small>
                      <strong>{comparisonGreedyValue}</strong>
                    </div>

                    <div className="comparison-stat">
                      <small>TIME USED</small>
                      <strong>{comparisonGreedyTime}s</strong>
                    </div>

                    <div className="comparison-method">
                      LOCAL BEST CHOICE
                    </div>
                  </motion.div>

                  <div className="comparison-vs">
                    VS
                  </div>

                  <motion.div
                    className="comparison-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="comparison-card-header">
                      <Grid3X3 size={20} />
                      <span>KNAPSACK</span>
                    </div>

                    <div className="comparison-stat">
                      <small>SELECTED CASES</small>
                      <strong>{knapsackSelected.length}</strong>
                    </div>

                    <div className="comparison-stat">
                      <small>TOTAL VALUE</small>
                      <strong>{comparisonKnapsackValue}</strong>
                    </div>

                    <div className="comparison-stat">
                      <small>TIME USED</small>
                      <strong>{comparisonKnapsackTime}s</strong>
                    </div>

                    <div className="comparison-method">
                      GLOBAL OPTIMAL SOLUTION
                    </div>
                  </motion.div>

                </div>

                <div className="comparison-result">

                  <div>
                    <span>VALUE DIFFERENCE</span>
                    <strong>
                      {valueDifference >= 0
                        ? `+${valueDifference}`
                        : valueDifference}
                    </strong>
                  </div>

                  <div>
                    <span>TIME DIFFERENCE</span>
                    <strong>
                      {timeDifference >= 0
                        ? `+${timeDifference}s`
                        : `${timeDifference}s`}
                    </strong>
                  </div>

                  <div>
                    <span>ANALYSIS</span>
                    <strong>
                      {valueDifference > 0
                        ? "KNAPSACK FOUND A HIGHER-VALUE COMBINATION"
                        : valueDifference === 0
                        ? "BOTH PRODUCED THE SAME VALUE"
                        : "GREEDY PRODUCED HIGHER VALUE"}
                    </strong>
                  </div>

                </div>
              </>
            )}
          </div>


          {/* STEP 07 COVERAGE ANALYSIS */}

          <div className="coverage-section">

            <div className="core-heading">
              <span>07</span>
              COVERAGE ANALYSIS
            </div>

            {!coverageReady ? (

              <div className="coverage-empty">
                <Target size={30} />
                <strong>COVERAGE ANALYSIS WAITING</strong>
                <span>
                  Run Greedy or Knapsack to calculate topic and edge-case coverage.
                </span>
              </div>

            ) : (
              <>

                <div className="coverage-overview">

                  <div className="coverage-overview-card">
                    <span>TOTAL TOPICS</span>
                    <strong>{allTopics.length}</strong>
                  </div>

                  <div className="coverage-overview-card">
                    <span>EDGE CASES</span>
                    <strong>{allEdgeCases.length}</strong>
                  </div>

                  <div className="coverage-overview-card">
                    <span>TEST CASES</span>
                    <strong>{testCases.length}</strong>
                  </div>

                  <div className="coverage-overview-card">
                    <span>TIME BUDGET</span>
                    <strong>{budget}s</strong>
                  </div>

                </div>

                <div className="coverage-grid">

                  {[
                    {
                      name: "GREEDY COVERAGE",
                      data: greedyCoverage,
                      icon: BrainCircuit,
                    },
                    {
                      name: "KNAPSACK COVERAGE",
                      data: knapsackCoverage,
                      icon: Grid3X3,
                    },
                  ].map(({ name, data, icon: Icon }) => (
                    <motion.div
                      className="coverage-card"
                      key={name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >

                      <div className="coverage-card-header">
                        <Icon size={19} />
                        <span>{name}</span>
                      </div>

                      <div className="coverage-main">
                        <strong>{data.overallCoverage}%</strong>
                        <span>OVERALL COVERAGE</span>
                      </div>

                      <div className="coverage-progress">
                        <div
                          className="coverage-progress-fill"
                          style={{ width: `${data.overallCoverage}%` }}
                        />
                      </div>

                      <div className="coverage-stat-row">
                        <span>TOPIC COVERAGE</span>
                        <strong>{data.topicCoverage}%</strong>
                      </div>

                      <div className="coverage-stat-row">
                        <span>EDGE-CASE COVERAGE</span>
                        <strong>{data.edgeCoverage}%</strong>
                      </div>

                      <div className="coverage-list">
                        <small>COVERED TOPICS</small>
                        {data.coveredTopics.length > 0 ? (
                          data.coveredTopics.map((topic) => (
                            <span className="coverage-tag" key={topic}>
                              {topic}
                            </span>
                          ))
                        ) : (
                          <span className="coverage-muted">None</span>
                        )}
                      </div>

                      <div className="coverage-list">
                        <small>UNCOVERED TOPICS</small>
                        {data.uncoveredTopics.length > 0 ? (
                          data.uncoveredTopics.map((topic) => (
                            <span
                              className="coverage-tag uncovered"
                              key={topic}
                            >
                              {topic}
                            </span>
                          ))
                        ) : (
                          <span className="coverage-success">All topics covered</span>
                        )}
                      </div>

                    </motion.div>
                  ))}

                </div>

                <div className="coverage-edge-panel">
                  <div className="coverage-edge-header">
                    <div>
                      <span>EDGE-CASE COVERAGE</span>
                      <small>Selected edge cases versus all available edge cases</small>
                    </div>
                    <ShieldAlert size={20} />
                  </div>

                  <div className="coverage-edge-grid">
                    <div>
                      <small>GREEDY</small>
                      <strong>{greedyCoverage.coveredEdgeCases.length} / {allEdgeCases.length}</strong>
                    </div>
                    <div>
                      <small>KNAPSACK</small>
                      <strong>{knapsackCoverage.coveredEdgeCases.length} / {allEdgeCases.length}</strong>
                    </div>
                    <div>
                      <small>AVAILABLE</small>
                      <strong>{allEdgeCases.length}</strong>
                    </div>
                  </div>
                </div>

              </>
            )}

          </div>


          {/* STEP 08 ANALYTICS + EXPORT */}

          <div className="analytics-section">

            <div className="core-heading">
              <span>08</span>
              ANALYTICS & EXPORT
            </div>

            <div className="coverage-overview">
              <div className="coverage-overview-card">
                <BarChart3 size={18} />
                <span>TOTAL TEST CASES</span>
                <strong>{testCases.length}</strong>
              </div>
              <div className="coverage-overview-card">
                <span>TOTAL EXECUTION TIME</span>
                <strong>{totalExecutionTime}s</strong>
              </div>
              <div className="coverage-overview-card">
                <span>AVERAGE PRIORITY</span>
                <strong>{averagePriority}</strong>
              </div>
              <div className="coverage-overview-card">
                <span>VALUE DIFFERENCE</span>
                <strong>{valueDifference >= 0 ? `+${valueDifference}` : valueDifference}</strong>
              </div>
            </div>

            <div className="coverage-grid">
              <motion.div className="coverage-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <div className="coverage-card-header">
                  <BarChart3 size={19} />
                  <span>TOPIC DISTRIBUTION</span>
                </div>
                {topicCounts.length === 0 ? (
                  <div className="coverage-empty">No topic data available.</div>
                ) : (
                  topicCounts.map((item) => (
                    <div key={item.topic} style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 7 }}>
                        <span>{item.topic}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ width: `${(item.count / maxTopicCount) * 100}%`, height: "100%", background: "#00e5ff", borderRadius: 10 }} />
                      </div>
                    </div>
                  ))
                )}
              </motion.div>

              <motion.div className="coverage-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <div className="coverage-card-header">
                  <Target size={19} />
                  <span>ALGORITHM PERFORMANCE</span>
                </div>

                <div className="coverage-stat-row">
                  <span>GREEDY VALUE</span>
                  <strong>{selectedValue}</strong>
                </div>
                <div className="coverage-stat-row">
                  <span>KNAPSACK VALUE</span>
                  <strong>{knapsackValue}</strong>
                </div>
                <div className="coverage-stat-row">
                  <span>GREEDY EXECUTION</span>
                  <strong>{greedyTime} ms</strong>
                </div>
                <div className="coverage-stat-row">
                  <span>KNAPSACK EXECUTION</span>
                  <strong>{knapsackTime} ms</strong>
                </div>
                <div className="coverage-stat-row">
                  <span>GREEDY COVERAGE</span>
                  <strong>{greedyCoverage.overallCoverage}%</strong>
                </div>
                <div className="coverage-stat-row">
                  <span>KNAPSACK COVERAGE</span>
                  <strong>{knapsackCoverage.overallCoverage}%</strong>
                </div>
              </motion.div>
            </div>

            <div className="coverage-edge-panel">
              <div className="coverage-edge-header">
                <div>
                  <span>REPORT EXPORT</span>
                  <small>Generate a judge-ready optimization report from the current results.</small>
                </div>
                <Download size={20} />
              </div>

              <div className="greedy-actions" style={{ marginTop: 18 }}>
                <button className="run-greedy-btn" onClick={exportPDF}>
                  <FileText size={17} />
                  EXPORT PDF
                </button>
                <button className="run-greedy-btn" onClick={exportExcel}>
                  <FileSpreadsheet size={17} />
                  EXPORT EXCEL
                </button>
              </div>
            </div>

          </div>


          {/* STEP 09 ALGORITHM CORE / DECISION TRACE */}

          <div className="algorithm-section algorithm-core-section">

            <div className="core-heading">
              <span>09</span>
              ALGORITHM CORE / DECISION TRACE
            </div>

            <div className="core-status-grid">

              <div className="core-status-card">
                <span>GREEDY</span>
                <strong>{greedyResults.length > 0 ? "COMPLETED" : "WAITING"}</strong>
                <small>
                  {greedyResults.length > 0
                    ? `${selectedCases.length} cases selected`
                    : "Run Greedy optimizer"}
                </small>
              </div>

              <div className="core-status-card">
                <span>KNAPSACK</span>
                <strong>{knapsackResults.length > 0 ? "COMPLETED" : "WAITING"}</strong>
                <small>
                  {knapsackResults.length > 0
                    ? `${knapsackSelected.length} cases selected`
                    : "Run Knapsack optimizer"}
                </small>
              </div>

              <div className="core-status-card">
                <span>BUDGET</span>
                <strong>{budget}s</strong>
                <small>Execution time limit</small>
              </div>

              <div className="core-status-card">
                <span>TEST CASES</span>
                <strong>{testCases.length}</strong>
                <small>Total available cases</small>
              </div>

            </div>

            <div className="decision-panel">

              <div className="decision-panel-header">
                <div>
                  <span className="decision-label">01 / GREEDY</span>
                  <h3>LOCAL DECISION TRACE</h3>
                </div>
                <div className="decision-metric">
                  <span>EXECUTION TIME</span>
                  <strong>{greedyTime} ms</strong>
                </div>
              </div>

              {greedyResults.length === 0 ? (
                <div className="decision-empty">
                  Run the Greedy optimizer to generate decisions.
                </div>
              ) : (
                <div className="decision-list">
                  <AnimatePresence>
                    {greedyResults.map((item, index) => (
                      <motion.div
                        className={`decision-row ${
                          item.decision === "SELECTED"
                            ? "decision-selected-row"
                            : "decision-rejected-row"
                        }`}
                        key={item.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="decision-index">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="decision-case">
                          <strong>{item.id}</strong>
                          <span>{item.name}</span>
                        </div>

                        <div className="decision-efficiency">
                          <small>EFFICIENCY</small>
                          <strong>{item.efficiency}</strong>
                        </div>

                        <div className="decision-cost">
                          <small>TIME</small>
                          <strong>{item.time}s</strong>
                        </div>

                        <div className="decision-action">
                          <span className={item.decision === "SELECTED" ? "selected" : "rejected"}>
                            {item.decision}
                          </span>
                        </div>

                        <div className="decision-reason">
                          {item.reason}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>

            <div className="decision-panel">

              <div className="decision-panel-header">
                <div>
                  <span className="decision-label">02 / KNAPSACK</span>
                  <h3>OPTIMAL DECISION TRACE</h3>
                </div>
                <div className="decision-metric">
                  <span>EXECUTION TIME</span>
                  <strong>{knapsackTime} ms</strong>
                </div>
              </div>

              {knapsackResults.length === 0 ? (
                <div className="decision-empty">
                  Run the Knapsack optimizer to generate decisions.
                </div>
              ) : (
                <div className="decision-list">
                  <AnimatePresence>
                    {knapsackResults.map((item, index) => (
                      <motion.div
                        className={`decision-row ${
                          item.decision === "SELECTED"
                            ? "decision-selected-row"
                            : "decision-rejected-row"
                        }`}
                        key={item.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="decision-index">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="decision-case">
                          <strong>{item.id}</strong>
                          <span>{item.name}</span>
                        </div>

                        <div className="decision-efficiency">
                          <small>VALUE</small>
                          <strong>{item.priority}</strong>
                        </div>

                        <div className="decision-cost">
                          <small>TIME</small>
                          <strong>{item.time}s</strong>
                        </div>

                        <div className="decision-action">
                          <span className={item.decision === "SELECTED" ? "selected" : "rejected"}>
                            {item.decision}
                          </span>
                        </div>

                        <div className="decision-reason">
                          {item.decision === "SELECTED"
                            ? "Included in the optimal feasible combination."
                            : "Excluded because the optimal solution was obtained without this test case."}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>

            <div className="complexity-panel">
              <div className="complexity-title">COMPLEXITY ANALYSIS</div>

              <div className="complexity-grid">
                <div>
                  <span>GREEDY</span>
                  <strong>O(n log n)</strong>
                  <small>Efficiency sorting + selection</small>
                </div>
                <div>
                  <span>KNAPSACK</span>
                  <strong>O(n × B)</strong>
                  <small>Dynamic programming</small>
                </div>
                <div>
                  <span>SORTING</span>
                  <strong>O(n²)</strong>
                  <small>Bubble Sort comparisons</small>
                </div>
                <div>
                  <span>DP SPACE</span>
                  <strong>O(n × B)</strong>
                  <small>Optimization matrix</small>
                </div>
              </div>
            </div>

            <div className="algorithm-flow">
              <motion.div className="algorithm-node">
                <small>ALGORITHM 01</small>
                <strong>SORTING</strong>
                <p>Rank test cases</p>
              </motion.div>

              <div className="flow-arrow">→</div>

              <motion.div className="algorithm-node">
                <small>ALGORITHM 02</small>
                <strong>GREEDY</strong>
                <p>Local selection</p>
              </motion.div>

              <div className="flow-arrow">→</div>

              <motion.div
                className="algorithm-node active-node"
                animate={{
                  boxShadow: [
                    "0 0 10px #00e5ff20",
                    "0 0 30px #00e5ff60",
                    "0 0 10px #00e5ff20",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <small>ALGORITHM 03</small>
                <strong>KNAPSACK</strong>
                <p>Optimal selection</p>
              </motion.div>
            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="metrics">

        <div className="metric">

          <span>
            TEST CASES
          </span>

          <strong>
            {testCases.length}
          </strong>

        </div>


        <div className="metric">

          <span>
            TOPICS
          </span>

          <strong>
            {
              new Set(
                testCases.map(
                  (item) => item.topic
                )
              ).size
            }
          </strong>

        </div>


        <div className="metric">

          <span>
            EDGE CASES
          </span>

          <strong>
            {
              testCases.filter(
                (item) =>
                  item.edgeCase === "Yes"
              ).length
            }
          </strong>

        </div>


        <div className="metric">

          <span>
            TOTAL EXECUTION
          </span>

          <strong>
            {
              testCases.reduce(
                (sum, item) =>
                  sum + Number(item.time),
                0
              )
            }{" "}
            sec
          </strong>

        </div>

      </footer>

    </div>
  );
}

export default Engine;