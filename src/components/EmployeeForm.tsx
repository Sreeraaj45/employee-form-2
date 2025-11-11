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
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SKILL_SECTIONS = {
  programming: {
    title: 'Programming Skills',
    icon: <Code2 className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    skills: ['Python', 'C++', 'Java', 'JavaScript', 'C', 'PySpark', 'Other']
  },
  dataAnalytics: {
    title: 'Data Analytics Competencies',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-500',
    skills: ['Power BI / Tableau', 'Visualization Libraries', 'SQL', 'NoSQL']
  }, 
  dataScience: {
    title: 'Data Science Competencies',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    skills: [
      'Data Modelling (ML Algorithms)',
      'Statistics',
      'SQL',
      'NoSQL',
      'Dashboards (Power BI, Grafana)'
    ]
  },
  dataEngineering: {
    title: 'Data Engineering Competencies',
    icon: <Database className="w-6 h-6" />,
    color: 'from-orange-500 to-yellow-500',
    skills: [
      'AWS',
      'GCP',
      'Azure',
      'Apache Airflow',
      'Kubernetes',
      'PySpark',
      'Docker',
      'NoSQL'
    ],
    levels: ['No Knowledge', 'Novice', 'Proficient', 'Expert', 'Advanced']
  },
  aiDL: {
    title: 'AI / Deep Learning Competencies',
    icon: <Cpu className="w-6 h-6" />,
    color: 'from-indigo-500 to-fuchsia-500',
    skills: [
      'TensorFlow',
      'PyTorch',
      'OpenCV',
      'Computer Vision Models',
      'Generative AI (GenAI)'
    ]
  },
  frontend: {
    title: 'Tool Automation & Development - Frontend Competencies',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-sky-500 to-violet-500',
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
    title: 'Tool Automation & Development - Backend Competencies',
    icon: <Server className="w-6 h-6" />,
    color: 'from-rose-500 to-red-500',
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js'],
    levels: ['No Knowledge', 'Novice', 'Proficient', 'Expert', 'Advanced']
  },
  devops: {
    title: 'DevOps Competencies',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-gray-500 to-slate-700',
    skills: ['Jenkins', 'CI/CD', 'Kubernetes', 'Docker'],
    levels: ['No Knowledge', 'Novice', 'Proficient', 'Expert', 'Advanced']
  }
};

const RATING_LABELS = {
  1: 'No Knowledge',
  2: 'Novice',
  3: 'Proficient',
  4: 'Expert',
  5: 'Advanced'
};

interface SkillRating {
  skill: string;
  rating: number;
  section: string;
}

interface FormData {
  name: string;
  employeeId: string;
  email: string;
  skillRatings: SkillRating[];
  additionalSkills: string;
}

export default function EmployeeForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    employeeId: '',
    email: '',
    skillRatings: [],
    additionalSkills: ''
  });
  const [expandedSections, setExpandedSections] = useState(
    Object.keys(SKILL_SECTIONS).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<string, boolean>
    )
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowError(false);

    try {
      const { error } = await supabase.from('employee_responses').insert([
        {
          name: formData.name,
          employee_id: formData.employeeId,
          email: formData.email,
          selected_skills: formData.skillRatings.map(sr => sr.skill),
          skill_ratings: formData.skillRatings,
          additional_skills: formData.additionalSkills,
          timestamp: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setFormData({
        name: '',
        employeeId: '',
        email: '',
        skillRatings: [],
        additionalSkills: ''
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ skill, section }: { skill: string; section: string }) => {
    const rating = getRating(skill, section);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRatingChange(skill, section, star)}
              className="group relative"
              type="button"
            >
              <svg
                className={`w-7 h-7 transition-all duration-200 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200 hover:fill-yellow-300 hover:text-yellow-300'
                }`}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {star <= rating ? RATING_LABELS[star as keyof typeof RATING_LABELS] : 'Rate'}
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-xs text-gray-600 font-medium">
            {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">DSET Employee Skill Mapping</h1>
            <p className="text-blue-100 text-lg">Comprehensive Skills Assessment Survey</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                  placeholder="IET-1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                placeholder="john@ielektron.com"
              />
            </div>
          </div>

          {/* Rating Legend */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Rating Scale</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(RATING_LABELS).map(([rating, label]) => (
                <div key={rating} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center text-sm font-bold text-yellow-900">
                    {rating}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Sections */}
          {(Object.entries(SKILL_SECTIONS) as any).map(([key, section]: any) => (
            <div key={key} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(key)}
                className={`w-full bg-gradient-to-r ${section.color} text-white p-6 flex items-center justify-between hover:shadow-lg transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">{section.icon}</div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    <p className="text-white text-opacity-90 text-sm">
                      {section.skills.length} skills to rate
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={24}
                  className={`transition-transform ${
                    expandedSections[key] ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections[key] && (
                <div className="p-8 space-y-6">
                  {section.skills.map((skill: string) => (
                    <div
                      key={skill}
                      className="flex items-start justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition"
                    >
                      <div className="flex-1">
                        <h4 className="text-gray-800 font-semibold text-base mb-1">{skill}</h4>
                        <p className="text-gray-500 text-xs">
                          {RATING_LABELS[
                            getRating(skill, key) as keyof typeof RATING_LABELS
                          ] || 'Not rated'}
                        </p>
                      </div>
                      <div className="ml-6">
                        <StarRating skill={skill} section={key} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Additional Skills */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Additional Skills & Certifications
            </h2>
            <textarea
              value={formData.additionalSkills}
              onChange={e =>
                setFormData({ ...formData, additionalSkills: e.target.value })
              }
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none resize-none"
              placeholder="Share any additional skills, certifications, or specializations you'd like to mention..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle size={24} />
          <span className="font-semibold">Assessment submitted successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-8 right-8 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <AlertCircle size={24} />
          <span className="font-semibold">Error submitting assessment. Please try again.</span>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
