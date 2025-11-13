import { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Code2,
  BarChart3,
  Brain,
  Database,
  Cpu,
  Layout,
  Server,
  Settings,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';

const SKILL_SECTIONS = {
  programming: {
    title: 'Programming Skills',
    icon: <Code2 className="w-6 h-6" />,
    color: 'from-sky-400 to-emerald-400',
    skills: ['Python', 'C++', 'Java', 'JavaScript', 'C', 'PySpark']
  },
  dataAnalytics: {
    title: 'Data Analytics',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-amber-400 to-pink-400',
    skills: ['Power BI / Tableau', 'Visualization Libraries', 'SQL', 'NoSQL']
  },
  dataScience: {
    title: 'Data Science',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-indigo-400 to-purple-400',
    skills: [
      'Data Modelling (ML Algorithms)',
      'Statistics',
      'SQL',
      'NoSQL',
      'Dashboards (Power BI, Grafana)'
    ]
  },
  dataEngineering: {
    title: 'Data Engineering',
    icon: <Database className="w-6 h-6" />,
    color: 'from-orange-400 to-yellow-400',
    skills: [
      'AWS',
      'GCP',
      'Azure',
      'Apache Airflow',
      'Kubernetes',
      'PySpark',
      'Docker',
      'NoSQL',
      'flyte'
    ]
  },
  aiDL: {
    title: 'AI / Deep Learning',
    icon: <Cpu className="w-6 h-6" />,
    color: 'from-fuchsia-400 to-rose-400',
    skills: [
      'TensorFlow',
      'PyTorch',
      'OpenCV',
      'Computer Vision Models',
      'Generative AI (GenAI)'
    ]
  },
  frontend: {
    title: 'Frontend Development',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-cyan-400 to-blue-400',
    skills: [
      'HTML',
      'CSS',
      'Bootstrap',
      'React',
      'Angular',
      'Tailwind CSS',
      'Vue.js',
      'TypeScript'
    ]
  },
  backend: {
    title: 'Backend Development',
    icon: <Server className="w-6 h-6" />,
    color: 'from-teal-400 to-green-400',
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js']
  },
  devops: {
    title: 'DevOps',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-gray-400 to-slate-500',
    skills: ['Jenkins', 'CI/CD', 'Kubernetes', 'Docker']
  }
};

const RATING_LABELS = {
  1: 'No Knowledge',
  2: 'Novice',
  3: 'Proficient',
  4: 'Expert',
  5: 'Advanced'
};

export default function EmployeeForm() {
  const sectionKeys = Object.keys(SKILL_SECTIONS);
  const totalSteps = sectionKeys.length + 1; // +1 for Additional Skills
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    skillRatings: [] as { skill: string; rating: number; section: string }[],
    additionalSkills: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);

  const handleRatingChange = (skill: string, section: string, rating: number) => {
    setFormData(prev => {
      const existing = prev.skillRatings.find(sr => sr.skill === skill && sr.section === section);
      const newRatings = existing
        ? prev.skillRatings.map(sr =>
          sr.skill === skill && sr.section === section ? { ...sr, rating } : sr
        )
        : [...prev.skillRatings, { skill, section, rating }];
      return { ...prev, skillRatings: newRatings };
    });
  };

  const getRating = (skill: string, section: string) =>
    formData.skillRatings.find(sr => sr.skill === skill && sr.section === section)?.rating || 0;

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.employeeId.trim()) return 'Employee ID is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@ielektron.com')) return 'Please use company email';
    if (formData.skillRatings.length === 0) return 'Please rate at least one skill';
    return null;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setStatus('error');
      // You might want to show this error in UI
      console.error(validationError);
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await api.createResponse({
        name: formData.name,
        employee_id: formData.employeeId,
        email: formData.email,
        selected_skills: formData.skillRatings.map(sr => sr.skill),
        skill_ratings: formData.skillRatings,
        additional_skills: formData.additionalSkills
      });
      setFormData({ name: '', employeeId: '', email: '', skillRatings: [], additionalSkills: '' });
      setCurrentStep(0);
      setStatus('success');
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const StarRating = ({ skill, section }: { skill: string; section: string }) => {
    const rating = getRating(skill, section);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(skill, section, star)}
              className="group transition-transform hover:scale-110"
            >
              <svg
                className={`w-7 h-7 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200'
                  }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-xs text-slate-600 text-center font-medium">
            {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    );
  };

  const currentSectionKey = sectionKeys[currentStep] || 'additional';
  const currentSection = SKILL_SECTIONS[currentSectionKey];
  const currentColor = currentSection?.color || 'from-sky-400 to-indigo-400';
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 py-12 relative overflow-hidden">
      {/* Floating background blobs */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-pink-200 opacity-30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-200 opacity-30 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 rounded-xl shadow-xl p-10 text-white mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="src/assets/logo.png"
              alt="Logo"
              className="w-20 h-20 rounded-full shadow-lg border-2 border-white/60 hover:scale-110 transition-transform duration-300"
            />
          </div>

          <div className="text-center flex flex-col items-center flex-1">
            <h1 className="text-4xl font-extrabold flex justify-center items-center gap-3">
              <Sparkles className="w-8 h-8 animate-spin-slow" />
              Employee Skill Mapping Survey
              <Sparkles className="w-8 h-8 animate-spin-slow" />
            </h1>
            <p className="text-white/80 mt-2 font-medium">
              Let’s explore your superpowers 🌈
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Info */}
          <section className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Personal Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                required
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
              />
              <input
                type="text"
                placeholder="Employee ID (Ex: IET - 1234)"
                value={formData.employeeId}
                required
                onChange={e => {
                  let value = e.target.value;

                  // Ensure it always starts with "IET - "
                  if (!value.startsWith("IET - ")) {
                    value = "IET - " + value.replace(/^IET\s*-\s*/i, ""); // Remove other variants
                  }

                  // Prevent lowercase or space errors
                  value = "IET - " + value.slice(6).replace(/[^0-9]/g, ""); // Allow only numbers after the prefix

                  setFormData({ ...formData, employeeId: value });
                }}
                className="p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
                maxLength={12}
              />

              <input
                type="email"
                placeholder="email.address@ielektron.com"
                value={formData.email}
                required
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none md:col-span-2"
              />
            </div>
          </section>

          {/* Progress Bar */}
          <div className="flex items-center gap-4 ">
            {/* Step Counter (moved outside the bar, left side) */}
            <span className="text-sm font-semibold text-slate-700 min-w-[90px] text-right">
              Step {currentStep + 1} of {totalSteps}
            </span>

            {/* Progress Bar */}
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className={`h-full bg-gradient-to-r ${currentColor} transition-[width] duration-700 ease-in-out`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Skill Sections */}
          {currentStep < sectionKeys.length ? (
            <div
              key={currentSectionKey}
              className="rounded-xl overflow-hidden shadow-xl bg-white"
            >
              <div
                className={`w-full flex justify-between items-center px-6 py-5 bg-gradient-to-r ${currentColor} text-white font-semibold text-lg`}
              >
                <div className="flex items-center gap-3">
                  {currentSection.icon}
                  {currentSection.title}
                </div>
              </div>

              <div className="p-6 space-y-5 bg-white">
                {currentSection.skills.map(skill => (
                  <div
                    key={skill}
                    className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-sky-50 transition"
                  >
                    <p className="font-medium text-slate-700">{skill}</p>
                    <StarRating skill={skill} section={currentSectionKey} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Additional Skills Section
            <section className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Additional Skills
              </h2>
              <textarea
                rows={4}
                placeholder="Tell us about other awesome things you can do..."
                value={formData.additionalSkills}
                onChange={e => setFormData({ ...formData, additionalSkills: e.target.value })}
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none resize-none"
              />
            </section>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-semibold shadow-md transition-transform hover:scale-105 ${currentStep === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-slate-400 to-slate-600 text-white'
                }`}
            >
              Previous
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1))}
                className={`px-6 py-3 rounded-xl font-semibold text-white shadow-md bg-gradient-to-r ${currentColor} transition-transform hover:scale-105`}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-sky-500 hover:to-indigo-500 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </form>

        {/* Toasts */}
        {status === 'success' && (
          <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce-in">
            <CheckCircle /> <span>Assessment submitted successfully 🎉</span>
          </div>
        )}
        {status === 'error' && (
          <div className="fixed bottom-6 right-6 bg-rose-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce-in">
            <AlertCircle /> <span>Oops! Something went wrong 😢</span>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes bounce-in {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
