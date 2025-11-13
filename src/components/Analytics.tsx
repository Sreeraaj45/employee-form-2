import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Loader, Maximize2, X } from "lucide-react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { api } from "../lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

am4core.useTheme(am4themes_animated);

interface EmployeeResponse {
  _id?: string;
  name: string;
  employee_id: string;
  email: string;
  selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number }>;
  additional_skills: string;
  timestamp: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "No Knowledge",
  2: "Novice",
  3: "Proficient",
  4: "Expert",
  5: "Advanced",
};

const SKILL_SECTIONS = {
  programming: {
    title: "Programming Skills",
    skills: ["Python", "C++", "Java", "JavaScript", "C", "PySpark"],
  },
  dataAnalytics: {
    title: "Data Analytics",
    skills: ["Power BI / Tableau", "Visualization Libraries", "SQL", "NoSQL"],
  },
  dataScience: {
    title: "Data Science",
    skills: [
      "Data Modelling (ML Algorithms)",
      "Statistics",
      "SQL",
      "NoSQL",
      "Dashboards (Power BI, Grafana)",
    ],
  },
  dataEngineering: {
    title: "Data Engineering",
    skills: [
      "AWS",
      "GCP",
      "Azure",
      "Apache Airflow",
      "Kubernetes",
      "PySpark",
      "Docker",
      "NoSQL",
      "flyte",
    ],
  },
  aiDL: {
    title: "AI / Deep Learning",
    skills: ["TensorFlow", "PyTorch", "OpenCV", "Computer Vision Models", "Generative AI (GenAI)"],
  },
  frontend: {
    title: "Frontend Development",
    skills: ["HTML", "CSS", "Bootstrap", "React", "Angular", "Tailwind CSS", "Vue.js", "TypeScript"],
  },
  backend: {
    title: "Backend Development",
    skills: ["Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Express.js"],
  },
  devops: {
    title: "DevOps",
    skills: ["Jenkins", "CI/CD", "Kubernetes", "Docker"],
  },
};

export default function Analytics() {
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [skillAnalytics, setSkillAnalytics] = useState<Array<{ skill: string; count: number; avgRating: number }>>([]);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const modalChartRef = useRef<HTMLDivElement | null>(null);
  // hold created amCharts instances so we can dispose correctly
  const pieChartInstance = useRef<any>(null);
  const modalPieChartInstance = useRef<any>(null);

  const [isPieModalOpen, setIsPieModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);

  useEffect(() => {
    loadAnalytics();
    // cleanup on unmount
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.dispose();
        pieChartInstance.current = null;
      }
      if (modalPieChartInstance.current) {
        modalPieChartInstance.current.dispose();
        modalPieChartInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // whenever skillAnalytics updates, recreate small chart
    createSmallPieChart();
    // if modal is open, recreate modal chart too to reflect new data
    if (isPieModalOpen) {
      createModalPieChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillAnalytics]);

  useEffect(() => {
    // when modal open toggles, create/dispose modal chart
    if (isPieModalOpen) {
      createModalPieChart();
    } else {
      if (modalPieChartInstance.current) {
        modalPieChartInstance.current.dispose();
        modalPieChartInstance.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPieModalOpen]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getResponses();
      setResponses(Array.isArray(data) ? data : []);
      analyzeSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setResponses([]);
      setSkillAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkills = (responseData: EmployeeResponse[]) => {
    const skillMap = new Map<string, { count: number; totalRating: number; ratingCount: number }>();

    responseData.forEach((response) => {
      // prefer skill_ratings if present; also count selected_skills as presence
      const seen = new Set<string>();
      (response.selected_skills || []).forEach((skill) => {
        if (!skillMap.has(skill)) skillMap.set(skill, { count: 0, totalRating: 0, ratingCount: 0 });
        const d = skillMap.get(skill)!;
        d.count++;
        seen.add(skill);
        const rating = (response.skill_ratings || []).find((sr) => sr.skill === skill);
        if (rating) {
          d.totalRating += rating.rating;
          d.ratingCount++;
        }
      });

      // If someone provided ratings for skills not in selected_skills, also include them
      (response.skill_ratings || []).forEach((sr) => {
        if (seen.has(sr.skill)) return;
        if (!skillMap.has(sr.skill)) skillMap.set(sr.skill, { count: 0, totalRating: 0, ratingCount: 0 });
        const d = skillMap.get(sr.skill)!;
        d.count++;
        d.totalRating += sr.rating;
        d.ratingCount++;
      });
    });

    const analytics = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      count: data.count,
      avgRating: data.ratingCount > 0 ? Number((data.totalRating / data.ratingCount).toFixed(1)) : 0,
    }));

    setSkillAnalytics(analytics.sort((a, b) => b.count - a.count));
  };

  const top5Skills = skillAnalytics.slice(0, 5);
  const top10Skills = skillAnalytics.slice(0, 10);

  const avgRating =
    skillAnalytics.length > 0 ? (skillAnalytics.reduce((sum, s) => sum + s.avgRating, 0) / skillAnalytics.length).toFixed(1) : "0";

  // Chart.js Bar Chart: Top 5 skills (small)
  const barChartData = {
    labels: top5Skills.map((s) => s.skill),
    datasets: [
      {
        label: "Employees per Skill",
        data: top5Skills.map((s) => s.count),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(59,130,246,0.9)");
          gradient.addColorStop(1, "rgba(29,78,216,0.7)");
          return gradient;
        },
        borderColor: "rgba(37,99,235,1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // <= removed legend
      },
      title: {
        display: true,
        text: "Top 5 Most Common Skills",
        color: "#111827",
        font: { size: 16, weight: "bold" as const },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#4B5563" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(229,231,235,0.4)" },
        ticks: { color: "#4B5563" },
      },
    },
  };

  // Modal bar (Top 10)
  const barModalData = {
    labels: top10Skills.map((s) => s.skill),
    datasets: [
      {
        label: "Employees per Skill",
        data: top10Skills.map((s) => s.count),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(59,130,246,0.9)");
          gradient.addColorStop(1, "rgba(29,78,216,0.7)");
          return gradient;
        },
        borderColor: "rgba(37,99,235,1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barModalOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Top 10 Most Common Skills",
        color: "#111827",
        font: { size: 18, weight: "bold" as const },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#4B5563" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(229,231,235,0.4)" },
        ticks: { color: "#4B5563" },
      },
    },
  };

  // Skills by section counts (aggregate counts from skillAnalytics)
  const skillsBySection = Object.entries(SKILL_SECTIONS).map(([key, section]: any) => {
    const skillSet = new Set(section.skills);
    const count = skillAnalytics.reduce((acc, s) => (skillSet.has(s.skill) ? acc + s.count : acc), 0);
    const distinct = skillAnalytics.filter((s) => skillSet.has(s.skill)).length;
    return { key, title: section.title, count, distinctSkills: distinct };
  });

  // ----- amCharts helpers -----
  const createPieChartOn = (div: HTMLDivElement | null, targetRef: React.MutableRefObject<any>) => {
    // Dispose previous if exists
    if (!div) return null;
    if (targetRef.current) {
      try {
        targetRef.current.dispose();
      } catch (e) {
        // ignore
      }
      targetRef.current = null;
    }

    const chart = am4core.create(div, am4charts.PieChart3D);
    // remove amCharts watermark/logo
    try {
      // disable the logo
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chart.logo && (chart.logo.disabled = true);
    } catch (e) {
      // ignore
    }

    chart.hiddenState.properties.opacity = 0;
    // chart.legend = undefined;
    chart.data = skillAnalytics.map((s) => ({ category: s.skill, value: s.count }));
    const series = chart.series.push(new am4charts.PieSeries3D());
    series.dataFields.value = "value";
    series.dataFields.category = "category";
    series.labels.template.text = "{category}: {value.percent.formatNumber('#.0')}%";
    series.labels.template.fill = am4core.color("#333");
    series.labels.template.fontSize = 14;
    series.ticks.template.disabled = false;
    series.ticks.template.strokeOpacity = 0.3;
    series.labels.template.wrap = true;
    series.labels.template.maxWidth = 180;
    series.labels.template.truncate = false;
    series.colors.list = [
      am4core.color("#A7C7E7"),
      am4core.color("#F7CAC9"),
      am4core.color("#C3E8BD"),
      am4core.color("#FBE5A1"),
      am4core.color("#E6C9F7"),
      am4core.color("#FFD6A5"),
      am4core.color("#B5EAD7"),
    ];
    chart.innerRadius = am4core.percent(25);
    chart.depth = 25;
    chart.radius = am4core.percent(65);
    chart.padding(16, 16, 16, 16);
    chart.align = "center";
    series.slices.template.tooltipText = "{category}: {value} employees ({value.percent.formatNumber('#.0')}%)";
    targetRef.current = chart;
    return chart;
  };

  const createSmallPieChart = () => {
    if (!chartRef.current) return;
    // dispose existing
    if (pieChartInstance.current) {
      try {
        pieChartInstance.current.dispose();
      } catch (e) {
        // ignore
      }
      pieChartInstance.current = null;
    }
    pieChartInstance.current = createPieChartOn(chartRef.current, pieChartInstance);
  };

  const createModalPieChart = () => {
    if (!modalChartRef.current) return;
    if (modalPieChartInstance.current) {
      try {
        modalPieChartInstance.current.dispose();
      } catch (e) {}
      modalPieChartInstance.current = null;
    }
    modalPieChartInstance.current = createPieChartOn(modalChartRef.current, modalPieChartInstance);
    // enlarge for modal
    if (modalPieChartInstance.current) {
      modalPieChartInstance.current.radius = am4core.percent(85);
      modalPieChartInstance.current.innerRadius = am4core.percent(30);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center gap-3">
          <Loader size={24} className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border border-blue-200">
          <div className="text-sm font-medium text-blue-600">Total Submissions</div>
          <div className="text-4xl font-bold text-blue-900 mt-2">{responses.length}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border border-green-200">
          <div className="text-sm font-medium text-green-600">Unique Skills</div>
          <div className="text-4xl font-bold text-green-900 mt-2">{skillAnalytics.length}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border border-purple-200">
          <div className="text-sm font-medium text-purple-600">Avg Rating</div>
          <div className="text-4xl font-bold text-purple-900 mt-2">{avgRating}★</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 relative flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top Skills (Top 5)</h3>
            <button
              onClick={() => setIsBarModalOpen(true)}
              title="Open bar chart fullscreen (Top 10)"
              className="p-2 rounded hover:bg-gray-100"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* 3D Pie Chart (small) with fullscreen button */}
        <div className="bg-white rounded-lg shadow-lg p-4 relative flex flex-col">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Skills Distribution</h3>
            <button
              onClick={() => setIsPieModalOpen(true)}
              title="Open pie chart fullscreen"
              className="p-2 rounded hover:bg-gray-100"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <div className="mt-3 flex-1 min-h-[360px]">
            <div ref={chartRef} id="chartdiv" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      {/* Skills by Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Skills by Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {skillsBySection.map((s) => (
              <div key={s.key} className="p-4 rounded-lg border bg-gray-50">
                <div className="text-sm text-gray-600">{s.title}</div>
                <div className="text-2xl font-bold text-gray-800 mt-2">{s.count}</div>
                <div className="text-sm text-gray-500 mt-1">{s.distinctSkills} distinct skills</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ratings & Top Skills Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Skills</h3>
          <div className="space-y-4">
            {top5Skills.length > 0 ? (
              top5Skills.map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{skill.skill}</span>
                    <span className="text-sm text-gray-600">{skill.count} employees</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{
                        width: `${(skill.count / Math.max(...skillAnalytics.map((s) => s.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No skills data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Skill Ratings</h3>
          <div className="space-y-4 max-h-[420px] overflow-auto">
            {skillAnalytics.length > 0 ? (
              skillAnalytics.map((skill, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 flex-1">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.round(skill.avgRating) ? "text-yellow-400" : "text-gray-300"}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{skill.avgRating}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No ratings data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal for Pie Chart */}
      {isPieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Skills Distribution</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPieModalOpen(false);
                  }}
                  title="Close"
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 h-full">
              <div ref={modalChartRef} style={{ width: "95%", height: "95%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal for Bar Chart (Top 10) */}
      {isBarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Top 10 Skills</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsBarModalOpen(false);
                  }}
                  title="Close"
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 h-full">
              <div style={{ width: "90%", height: "100%" }}>
                <Bar data={barModalData} options={barModalOptions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
