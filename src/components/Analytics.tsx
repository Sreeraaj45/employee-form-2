import { useState, useEffect, useRef } from "react";
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
import { Loader } from "lucide-react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { api } from "../lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

am4core.useTheme(am4themes_animated);

interface EmployeeResponse {
  name: string;
  employeeId: string;
  email: string;
  selectedSkills: string[];
  skillRatings: Array<{ skill: string; rating: number }>;
  additionalSkills: string;
  timestamp: string;
}

export default function Analytics() {
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [skillAnalytics, setSkillAnalytics] = useState<
    Array<{ skill: string; count: number; avgRating: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getResponses();
      const parsed = data.map(row => ({
        name: row.name,
        employeeId: row.employee_id,
        email: row.email,
        selectedSkills: row.selected_skills || [],
        skillRatings: row.skill_ratings || [],
        additionalSkills: row.additional_skills || '',
        timestamp: row.timestamp
      })) as EmployeeResponse[];

      setResponses(parsed);
      analyzeSkills(parsed);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkills = (responseData: EmployeeResponse[]) => {
    const skillMap = new Map<string, { count: number; totalRating: number; ratingCount: number }>();

    responseData.forEach((response) => {
      response.selectedSkills.forEach((skill) => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { count: 0, totalRating: 0, ratingCount: 0 });
        }
        const skillData = skillMap.get(skill)!;
        skillData.count++;

        const rating = response.skillRatings.find((sr) => sr.skill === skill);
        if (rating) {
          skillData.totalRating += rating.rating;
          skillData.ratingCount++;
        }
      });
    });

    const analytics = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      count: data.count,
      avgRating: data.ratingCount > 0 ? Number((data.totalRating / data.ratingCount).toFixed(1)) : 0,
    }));

    setSkillAnalytics(analytics.sort((a, b) => b.count - a.count));
  };

  const topSkills = skillAnalytics.slice(0, 5);
  const avgRating =
    skillAnalytics.length > 0
      ? (
          skillAnalytics.reduce((sum, s) => sum + s.avgRating, 0) / skillAnalytics.length
        ).toFixed(1)
      : 0;

  // 🧩 Chart.js Bar Chart (Original Color Scheme)
  const barChartData = {
    labels: topSkills.map((s) => s.skill),
    datasets: [
      {
        label: "Employees per Skill",
        data: topSkills.map((s) => s.count),
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
        position: "right" as const,
        labels: {
          color: "#374151",
          boxWidth: 20,
        },
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

  // 🥧 amCharts 3D Pie Setup (Soft Colors + No Legend + Centered)
  useEffect(() => {
    if (!chartRef.current || skillAnalytics.length === 0) return;

    const chart = am4core.create(chartRef.current, am4charts.PieChart3D);
    chart.hiddenState.properties.opacity = 0;

    // Remove legend since we’re already showing labels
    chart.legend = undefined;

    // Chart Data
    chart.data = skillAnalytics.map((s) => ({
      category: s.skill,
      value: s.count,
    }));

    const series = chart.series.push(new am4charts.PieSeries3D());
    series.dataFields.value = "value";
    series.dataFields.category = "category";

    // Label and tooltip adjustments
    series.labels.template.text = "{category}: {value.percent.formatNumber('#.0')}%";
    series.labels.template.fill = am4core.color("#333");
    series.labels.template.fontSize = 13;
    series.ticks.template.disabled = false;
    series.ticks.template.strokeOpacity = 0.3;
    series.labels.template.wrap = true;
    series.labels.template.maxWidth = 120;
    series.labels.template.truncate = false;

    // Soft pastel color palette
    series.colors.list = [
      am4core.color("#A7C7E7"), // soft blue
      am4core.color("#F7CAC9"), // soft pink
      am4core.color("#C3E8BD"), // soft green
      am4core.color("#FBE5A1"), // soft yellow
      am4core.color("#E6C9F7"), // soft lavender
      am4core.color("#FFD6A5"), // peach
      am4core.color("#B5EAD7"), // mint
    ];

    // 3D depth and position
    chart.innerRadius = am4core.percent(25);
    chart.depth = 25;
    chart.radius = am4core.percent(65);
    chart.padding(20, 20, 20, 20);
    chart.margin(0, 0, 0, 0);

    // Center alignment
    chart.align = "center";

    // Tooltip text
    series.slices.template.tooltipText = "{category}: {value} employees ({value.percent.formatNumber('#.0')}%)";

    return () => {
      chart.dispose();
    };
  }, [skillAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Employee form insights & skill statistics</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center gap-3">
          <Loader size={24} className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Employee form insights & skill statistics</p>
      </div>

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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        {/* 3D Pie Chart (Centered & Soft Colors) */}
        <div className="bg-white rounded-lg shadow-lg p-6 flex justify-center items-center">
          <div id="chartdiv" ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
        </div>
      </div>

      {/* Ratings & Submissions Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Skills</h3>
          <div className="space-y-4">
            {topSkills.length > 0 ? (
              topSkills.map((skill, index) => (
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
          <div className="space-y-4">
            {skillAnalytics.length > 0 ? (
              skillAnalytics.map((skill, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 flex-1">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < Math.round(skill.avgRating) ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                      {skill.avgRating}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No ratings data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 