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
import {
  Loader,
  Maximize2,
  X,
  Users,
  Code2,
  Code,
  Star,
  BarChart3,
  Cpu,
  Brain,
  Database,
  Settings,
  Server,
  Layout,
  Car,
  ChevronDown,
} from "lucide-react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { api } from "../lib/api";
import SkillDetailModal from "./SkillDetailModal";
import SkillsListModal from "./SkillsListModal";

// --- Chart Setup ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
am4core.useTheme(am4themes_animated);

// --- Interfaces and Constants ---
interface EmployeeResponse {
  _id?: string;
  name: string;
  employee_id: string;
  email: string;
  selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number; section?: string }>;
  additional_skills: string;
  timestamp?: string;
}

interface EmployeeSkillData {
  name: string;
  employee_id: string;
  email: string;
  rating: number;
  categoryAvgRating?: number;
}

const SKILL_SECTIONS = {
  programming: {
    title: "Programming Skills",
    skills: ["Python", "C++", "Java","Rust", "JavaScript", "C", "PySpark", "SQL", "NoSQL"],
    icon: Code2,
    color: "from-sky-400 to-emerald-400",
  },
  dataAnalytics: {
    title: "Data Analytics",
    skills: ["Power BI / Tableau", "Visualization Libraries"],
    icon: BarChart3,
    color: "from-amber-400 to-pink-400",
  },
  dataScience: {
    title: "Data Science",
    skills: [
      "Data Modelling (ML Algorithms)",
      "Statistics (Fundamental statistical concepts)",
      "Dashboards (Power BI, Grafana)",
    ],
    icon: Brain,
    color: "from-indigo-400 to-purple-400",
  },
  dataEngineering: {
    title: "Data Engineering",
    skills: [
      "AWS",
      "GCP",
      "Azure",
      "Apache Airflow",
      "Kubernetes",
      "Docker",
      "flyte",
    ],
    icon: Database,
    color: "from-orange-400 to-yellow-400",
  },
  aiDL: {
    title: "AI / Deep Learning",
    skills: ["TensorFlow", "PyTorch", "OpenCV", "Computer Vision Models", "Generative AI (GenAI)"],
    icon: Cpu,
    color: "from-fuchsia-400 to-rose-400",
  },
  frontend: {
    title: "Frontend Development",
    skills: ["HTML", "CSS", "Bootstrap", "React", "Angular", "Tailwind CSS", "Vue.js", "TypeScript"],
    icon: Layout,
    color: "from-cyan-400 to-blue-400",
  },
  backend: {
    title: "Backend Development",
    skills: ["Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Express.js"],
    icon: Server,
    color: "from-teal-400 to-green-400",
  },
  devops: {
    title: "DevOps",
    skills: ["Jenkins", "CI/CD"],
    icon: Settings,
    color: "from-slate-400 to-indigo-400",
  },
  ADAS: {
    title: 'ADAS',
    skills: ['Camera calibration/processing', 'LiDAR (3D)', 'Sensor fusion'],
    icon: Car,
    color: 'from-rose-400 to-orange-400',
  }
};

// --- Analytics Component ---
export default function Analytics() {
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [skillAnalytics, setSkillAnalytics] = useState<
    Array<{ skill: string; count: number; avgRating: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const modalChartRef = useRef<HTMLDivElement | null>(null);
  const pieChartInstance = useRef<any>(null);
  const modalPieChartInstance = useRef<any>(null);

  const [isPieModalOpen, setIsPieModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  
  // Modal state for skill details
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{
    name: string;
    employees: EmployeeSkillData[];
    sectionTitle: string;
    sectionColor: string;
  } | null>(null);
  const [showTop5Only, setShowTop5Only] = useState(true);

  // Skills list modal state
  const [skillsListModalOpen, setSkillsListModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    key: string;
    title: string;
    color: string;
    icon: any;
  } | null>(null);

  // --- Data Loading and Analysis ---
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // NOTE: This assumes `api.getResponses()` returns a promise that resolves to the data
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
    const skillMap = new Map<
      string,
      { count: number; totalRating: number; ratingCount: number }
    >();

    responseData.forEach((response) => {
      const seen = new Set<string>();
      (response.selected_skills || []).forEach((skill) => {
        if (!skillMap.has(skill))
          skillMap.set(skill, { count: 0, totalRating: 0, ratingCount: 0 });
        const d = skillMap.get(skill)!;
        d.count++;
        seen.add(skill);
        const rating = (response.skill_ratings || []).find(
          (sr) => sr.skill === skill
        );
        if (rating) {
          d.totalRating += rating.rating;
          d.ratingCount++;
        }
      });

      (response.skill_ratings || []).forEach((sr) => {
        if (seen.has(sr.skill)) return;
        if (!skillMap.has(sr.skill))
          skillMap.set(sr.skill, { count: 0, totalRating: 0, ratingCount: 0 });
        const d = skillMap.get(sr.skill)!;
        d.count++;
        d.totalRating += sr.rating;
        d.ratingCount++;
      });
    });

    const analytics = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      count: data.count,
      avgRating:
        data.ratingCount > 0
          ? Number((data.totalRating / data.ratingCount).toFixed(1))
          : 0,
    }));

    setSkillAnalytics(analytics.sort((a, b) => b.count - a.count));
  };

  // --- Effects for Data Loading and Chart Management ---
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

  // --- Data Preparation ---
  const top5Skills = skillAnalytics.slice(0, 5);
  const top10Skills = skillAnalytics.slice(0, 10);

  const avgRating =
    skillAnalytics.length > 0
      ? (
          skillAnalytics.reduce((sum, s) => sum + s.avgRating, 0) /
          skillAnalytics.length
        ).toFixed(1)
      : "0";

  // Calculate category average rating for an employee
  const getCategoryAverageRating = (employeeId: string, sectionKey: string): number => {
    const section = SKILL_SECTIONS[sectionKey as keyof typeof SKILL_SECTIONS];
    if (!section) return 0;

    const response = responses.find(r => r.employee_id === employeeId);
    if (!response) return 0;

    const sectionSkills = new Set(section.skills);
    const ratings = response.skill_ratings?.filter(sr => sectionSkills.has(sr.skill)) || [];
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, sr) => acc + sr.rating, 0);
    return sum / ratings.length;
  };

  // Get employees for a specific skill
  const getEmployeesForSkill = (skillName: string, sectionKey?: string): EmployeeSkillData[] => {
    const employees: EmployeeSkillData[] = [];
    
    responses.forEach((response) => {
      const skillRating = response.skill_ratings?.find(
        (sr) => sr.skill === skillName
      );
      
      if (skillRating) {
        const categoryAvgRating = sectionKey ? getCategoryAverageRating(response.employee_id, sectionKey) : undefined;
        
        employees.push({
          name: response.name,
          employee_id: response.employee_id,
          email: response.email,
          rating: skillRating.rating,
          categoryAvgRating,
        });
      }
    });
    
    // Sort by rating (highest first), then by category average
    return employees.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return (b.categoryAvgRating || 0) - (a.categoryAvgRating || 0);
    });
  };

  // Get top 5 employees for each skill in a section
  const getTopEmployeesPerSection = (sectionKey: string) => {
    const section = SKILL_SECTIONS[sectionKey as keyof typeof SKILL_SECTIONS];
    if (!section) return [];
    
    return section.skills.map((skill) => {
      const allEmployees = getEmployeesForSkill(skill);
      const top5 = allEmployees.slice(0, 5);
      
      return {
        skill,
        employees: top5,
        totalCount: allEmployees.length,
        allEmployees,
      };
    }).filter(item => item.totalCount > 0); // Only show skills with employees
  };

  const handleViewAllEmployees = (
    skillName: string,
    sectionTitle: string,
    sectionColor: string,
    sectionKey: string
  ) => {
    const employees = getEmployeesForSkill(skillName, sectionKey);
    setSelectedSkill({
      name: skillName,
      employees,
      sectionTitle,
      sectionColor,
    });
    setShowTop5Only(true);
    setSkillModalOpen(true);
  };

  const handleSectionClick = (sectionKey: string) => {
    const section = SKILL_SECTIONS[sectionKey as keyof typeof SKILL_SECTIONS];
    if (!section) return;

    setSelectedSection({
      key: sectionKey,
      title: section.title,
      color: section.color,
      icon: section.icon,
    });
    setSkillsListModalOpen(true);
  };

  const handleSkillClickFromList = (skillName: string) => {
    if (!selectedSection) return;
    
    setSkillsListModalOpen(false);
    handleViewAllEmployees(skillName, selectedSection.title, selectedSection.color, selectedSection.key);
  };

  const handleBackToSkillsList = () => {
    setSkillModalOpen(false);
    setSelectedSkill(null);
    setShowTop5Only(true);
    setSkillsListModalOpen(true);
  };

  // --- Chart.js Data and Options ---
  const barChartData = {
    labels: top5Skills.map((s) => s.skill),
    datasets: [
      {
        label: "Employees per Skill",
        data: top5Skills.map((s) => s.count),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.9)"); // Indigo 600
          gradient.addColorStop(1, "rgba(55, 48, 163, 0.7)"); // Indigo 800
          return gradient;
        },
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 1,
        borderRadius: 4,
        // Reduced bar width
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
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

  const barModalData = {
    labels: top10Skills.map((s) => s.skill),
    datasets: [
      {
        label: "Employees per Skill",
        data: top10Skills.map((s) => s.count),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.9)");
          gradient.addColorStop(1, "rgba(55, 48, 163, 0.7)");
          return gradient;
        },
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 1,
        borderRadius: 8,
        // Reduced bar width for modal too
        barPercentage: 0.4,
        categoryPercentage: 0.6,
      },
    ],
  };

  const barModalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Top 10 Most Common Skills",
        color: "#111827",
        font: { size: 20, weight: "bold" as const },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: "#4B5563",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(229,231,235,0.4)" },
        ticks: { color: "#4B5563" },
      },
    },
  };

  // --- amCharts Helpers (3D Pie Chart) ---
  const createPieChartOn = (
    div: HTMLDivElement | null,
    targetRef: React.MutableRefObject<any>
  ) => {
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
    try {
      // @ts-ignore
      chart.logo && (chart.logo.disabled = true);
    } catch (e) {}

    chart.hiddenState.properties.opacity = 0;
    // Limit data to top 15 for readability in small chart
    const dataForPie = skillAnalytics
      .map((s) => ({ category: s.skill, value: s.count }));
    chart.data = dataForPie;

    const series = chart.series.push(new am4charts.PieSeries3D());
    series.dataFields.value = "value";
    series.dataFields.category = "category";
    series.labels.template.text = "{category}: {value.percent.formatNumber('#.0')}%";
    series.labels.template.fill = am4core.color("#4B5563"); // Gray 600
    series.labels.template.fontSize = 10;
    series.labels.template.fontWeight = "600";
    series.ticks.template.disabled = false;
    series.ticks.template.strokeOpacity = 0.5;
    series.labels.template.wrap = true;
    series.labels.template.maxWidth = 150;
    series.labels.template.truncate = false;

    // Changed to your pastel color palette
    series.colors.list = [
      am4core.color("#A7C7E7"), // Light blue
      am4core.color("#F7CAC9"), // Light pink
      am4core.color("#C3E8BD"), // Light green
      am4core.color("#FBE5A1"), // Light yellow
      am4core.color("#E6C9F7"), // Light purple
      am4core.color("#FFD6A5"), // Light orange
      am4core.color("#B5EAD7"), // Light mint
    ];
    
    chart.innerRadius = am4core.percent(30);
    chart.depth = 35;
    chart.radius = am4core.percent(70);
    chart.padding(16, 16, 16, 16);
    chart.align = "center";
    series.slices.template.tooltipText =
      "{category}: {value} employees ({value.percent.formatNumber('#.0')}%)";
    targetRef.current = chart;
    return chart;
  };

  const createSmallPieChart = () => {
    if (!chartRef.current) return;
    if (pieChartInstance.current) {
      try {
        pieChartInstance.current.dispose();
      } catch (e) {}
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
    modalPieChartInstance.current = createPieChartOn(
      modalChartRef.current,
      modalPieChartInstance
    );
    // Adjust modal chart appearance
    if (modalPieChartInstance.current) {
      modalPieChartInstance.current.radius = am4core.percent(85);
      modalPieChartInstance.current.innerRadius = am4core.percent(40);
      modalPieChartInstance.current.depth = 45;
    }
  };

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-2xl p-16 flex flex-col items-center justify-center gap-4 border border-gray-100">
          <Loader size={32} className="animate-spin text-indigo-600" />
          <span className="text-xl font-medium text-gray-700">Loading comprehensive analytics...</span>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Render ---
  return (
    <div className="space-y-6 p-2 md:p-6 bg-gray-50 min-h-screen">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Submissions */}
      <div className="bg-blue-50 rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-blue-100 group">
        <div className="flex items-center justify-between">
          <Users className="w-6 h-6 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Total Submissions
          </div>
        </div>
        <div className="text-3xl font-extrabold text-blue-700 mt-2 transition-transform duration-300">
          {responses.length}
        </div>
        <p className="text-xs text-gray-700 mt-1">Total responses collected</p>
      </div>

      {/* Unique Skills */}
      <div className="bg-green-50 rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-green-100 group">
        <div className="flex items-center justify-between">
          <Code className="w-6 h-6 text-green-500 transition-transform duration-300 group-hover:scale-110" />
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Unique Skills
          </div>
        </div>
        <div className="text-3xl font-extrabold text-green-700 mt-2 transition-transform duration-300">
          {skillAnalytics.length}
        </div>
        <p className="text-xs text-gray-700 mt-1">Distinct skills rated/selected</p>
      </div>

      {/* Avg Rating */}
      <div className="bg-yellow-50 rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-yellow-100 group">
        <div className="flex items-center justify-between">
          <Star className="w-6 h-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Overall Avg Rating
          </div>
        </div>
        <div className="text-3xl font-extrabold text-yellow-700 mt-2 transition-transform duration-300">
          {avgRating}
        </div>
        <p className="text-xs text-gray-700 mt-1">Average proficiency across all skills</p>
      </div>
    </div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Bar Chart (Top 5) - Smaller width */}
        <div className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 relative flex flex-col lg:col-span-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800">Top 5 Employee Skills</h3>
            <button
              onClick={() => setIsBarModalOpen(true)}
              title="Open bar chart fullscreen (Top 10)"
              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Count of employees mentioning the skill.</p>
          <div className="min-h-[300px] flex items-center justify-center">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* 3D Pie Chart (small) - Larger width */}
        <div className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 relative flex flex-col lg:col-span-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800">Skill Distribution</h3>
            <button
              onClick={() => setIsPieModalOpen(true)}
              title="Open pie chart fullscreen"
              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Percentage breakdown of all recorded skills.</p>
          <div className="mt-3 flex-1 min-h-[300px]">
            <div
              ref={chartRef}
              id="chartdiv"
              style={{ width: "100%", height: "100%", minHeight: "300px" }}
            />
          </div>
        </div>
      </div>

      {/* --- Skill Categories Grid (3x3) --- */}
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Skill Categories</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Object.entries(SKILL_SECTIONS).map(([sectionKey, section]) => {
            const topEmployeesData = getTopEmployeesPerSection(sectionKey);
            
            if (topEmployeesData.length === 0) return null;
            
            const Icon = section.icon;
            const totalEmployees = topEmployeesData.reduce((sum, skill) => sum + skill.totalCount, 0);
            
            return (
              <button
                key={sectionKey}
                onClick={() => handleSectionClick(sectionKey)}
                className={`bg-gradient-to-br ${section.color} rounded-xl shadow-lg p-4 md:p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-left group`}
              >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className={`p-3 md:p-4 rounded-xl bg-white/30 group-hover:bg-white/50 transition-all`}>
                    <Icon size={28} className="text-white md:w-8 md:h-8" />
                  </div>
                  <div className="bg-white/90 px-2 md:px-3 py-1 rounded-full">
                    <span className="text-xs md:text-sm font-bold text-gray-700">
                      {topEmployeesData.length} skills
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2 group-hover:text-white/90 transition-colors">
                  {section.title}
                </h3>
                
                <p className="text-xs md:text-sm text-white/80 font-medium">
                  {totalEmployees} total employee {totalEmployees === 1 ? 'rating' : 'ratings'}
                </p>
                
                <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs md:text-sm font-semibold text-white">
                  <span>View Skills</span>
                  <ChevronDown size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Skills by Section & Ratings/Top Skills --- */}
      <div className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Skills List (Progress Bars) */}
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Top Skill Momentum (Top 5)</h3>
            <div className="space-y-6">
              {top5Skills.length > 0 ? (
                top5Skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lg font-semibold text-gray-800">{skill.skill}</span>
                      <span className="text-base font-medium text-indigo-600">
                        {skill.count} employees
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-700 ease-out"
                        style={{
                          width: `${
                            (skill.count /
                              Math.max(...skillAnalytics.map((s) => s.count), 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No skills data available for visualization.</p>
              )}
            </div>
          </div>

          {/* Skill Ratings List (Stars) */}
          <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Skill Proficiency Overview</h3>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {skillAnalytics.length > 0 ? (
                skillAnalytics.map((skill, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition duration-150"
                  >
                    <span className="text-base text-gray-700 flex-1 font-medium">
                      {skill.skill}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            fill={i < Math.round(skill.avgRating) ? "#FBBF24" : "none"} // Yellow 400
                            stroke={i < Math.round(skill.avgRating) ? "#FBBF24" : "#D1D5DB"} // Gray 300
                            className="transition duration-100"
                          />
                        ))}
                      </div>
                      <span className="text-base font-bold text-indigo-700 w-8 text-right">
                        {skill.avgRating}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No ratings data available for overview.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal for Pie Chart */}
      {isPieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] relative transform scale-100 transition-transform duration-300">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">Full Skills Distribution</h3>
              <button
                onClick={() => setIsPieModalOpen(false)}
                title="Close"
                className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 h-[calc(100vh-120px)] flex items-center justify-center">
              <div ref={modalChartRef} style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal for Bar Chart (Top 10) */}
      {isBarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-0 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-screen relative transform scale-100 transition-transform duration-300 mt-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-800">
                Top 10 Most Common Skills
              </h3>
              <button
                onClick={() => setIsBarModalOpen(false)}
                title="Close"
                className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chart Content */}
            <div className="p-8 h-[calc(100vh-120px)] flex items-center justify-center">
              <div className="w-full h-full">
                <Bar data={barModalData} options={barModalOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills List Modal */}
      {selectedSection && (
        <SkillsListModal
          isOpen={skillsListModalOpen}
          onClose={() => {
            setSkillsListModalOpen(false);
            setSelectedSection(null);
          }}
          sectionTitle={selectedSection.title}
          sectionColor={selectedSection.color}
          sectionIcon={selectedSection.icon}
          skills={getTopEmployeesPerSection(selectedSection.key).map(s => ({
            skill: s.skill,
            totalCount: s.totalCount,
          }))}
          onSkillClick={handleSkillClickFromList}
        />
      )}

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <SkillDetailModal
          isOpen={skillModalOpen}
          onClose={() => {
            setSkillModalOpen(false);
            setSelectedSkill(null);
            setShowTop5Only(true);
            setSelectedSection(null);
          }}
          skillName={selectedSkill.name}
          employees={selectedSkill.employees}
          sectionTitle={selectedSkill.sectionTitle}
          sectionColor={selectedSkill.sectionColor}
          showTop5Only={showTop5Only}
          onShowMore={() => setShowTop5Only(false)}
          onBack={selectedSection ? handleBackToSkillsList : undefined}
        />
      )}
    </div>
  );
}