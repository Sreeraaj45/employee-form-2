import { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Code2,
  BarChart3,
  Brain,
  Database,
  Cpu,
  Layout,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

const SKILL_SECTIONS = {
  programming: {
    title: 'Programming Skills',
    icon: <Code2 className="w-5 h-5 text-gray-700" />,
    skills: ['Python', 'C++', 'Java', 'JavaScript', 'C', 'PySpark', 'Other']
  },
  dataAnalytics: {
    title: 'Data Analytics',
    icon: <BarChart3 className="w-5 h-5 text-gray-700" />,
    skills: ['Power BI / Tableau', 'Visualization Libraries', 'SQL', 'NoSQL']
  },
  dataScience: {
    title: 'Data Science',
    icon: <Brain className="w-5 h-5 text-gray-700" />,
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
    icon: <Database className="w-5 h-5 text-gray-700" />,
    skills: [
      'AWS',
      'GCP',
      'Azure',
      'Apache Airflow',
      'Kubernetes',
      'PySpark',
      'Docker',
      'NoSQL'
    ]
  },
  aiDL: {
    title: 'AI / Deep Learning',
    icon: <Cpu className="w-5 h-5 text-gray-700" />,
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
    icon: <Layout className="w-5 h-5 text-gray-700" />,
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
    icon: <Server className="w-5 h-5 text-gray-700" />,
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js']
  },
  devops: {
    title: 'DevOps',
    icon: <Settings className="w-5 h-5 text-gray-700" />,
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
  const sections = Object.entries(SKILL_SECTIONS);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    skillRatings: [] as { skill: string; rating: number; section: string }[],
    additionalSkills: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [showSummary, setShowSummary] = useState(false);

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

  const handleNext = () => setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
  const handlePrev = () => setCurrentSection(prev => Math.max(prev - 1, 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSummary(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
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
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setStatus('success');
      setFormData({ name: '', employeeId: '', email: '', skillRatings: [], additionalSkills: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setShowSummary(false);
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const StarRating = ({ skill, section }: { skill: string; section: string }) => {
    const rating = getRating(skill, section);
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(skill, section, star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating ? 'fill-gray-800 text-gray-800' : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-xs text-gray-500">
            {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    );
  };

  const progressPercent = ((currentSection + 1) / sections.length) * 100;

  return (
    <div
      className="min-h-screen py-10"
      style={{
        background:
          'linear-gradient(to right, #FFFDE4, #005AA7)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 bg-white/80 backdrop-blur-md p-8 rounded-[4px] border border-white/40">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Skill Mapping Survey</h1>
          <p className="text-gray-600 text-sm mt-1">A concise, professional skill assessment</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <section className="border border-gray-200 rounded-[4px] p-5 bg-white/90">
            <div className="flex justify-between items-start flex-wrap gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="p-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Employee ID"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    className="p-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="p-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gray-500 md:col-span-2"
                  />
                </div>
              </div>

              {/* Subtle Legend */}
              <div className="text-sm text-gray-700 bg-gray-100/60 p-4 rounded-[4px] shadow-inner w-full md:w-64">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-gray-700" />
                  <p className="font-semibold">Rating Legend</p>
                </div>
                <ul className="space-y-1 text-gray-600">
                  {Object.entries(RATING_LABELS).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2">
                      {[...Array(Number(k))].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-gray-500 fill-gray-500"
                        />
                      ))}
                      <span className="text-xs">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Skill Wizard */}
          <section className="border border-gray-200 rounded-[4px] p-5 bg-white/90">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {sections[currentSection][1].icon}
                {sections[currentSection][1].title}
              </h3>
              <div className="text-sm text-gray-500 flex flex-col items-end">
                <span>
                  Section {currentSection + 1} of {sections.length}
                </span>
                <div className="w-32 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-1 bg-gray-800 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {sections[currentSection][1].skills.map(skill => (
                <div
                  key={skill}
                  className="flex justify-between items-center border-b border-gray-100 pb-2"
                >
                  <span>{skill}</span>
                  <StarRating skill={skill} section={sections[currentSection][0]} />
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSection === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-[4px] text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft size={18} /> Previous
              </button>

              {currentSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-[4px] text-gray-600"
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-800 text-gray-800 rounded-[4px]"
                >
                  Review & Submit
                </button>
              )}
            </div>
          </section>
        </form>

        {/* Review Popup */}
        {showSummary && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-[4px] p-6 w-full max-w-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Review Your Submission</h3>
              <div className="text-sm text-gray-700 space-y-3 max-h-96 overflow-y-auto border-t border-gray-100 pt-3">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Employee ID:</strong> {formData.employeeId}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Additional Skills:</strong> {formData.additionalSkills || '—'}</p>
                <hr className="my-2" />
                {formData.skillRatings.map((sr, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{sr.skill}</span>
                    <span className="text-gray-500">
                      {RATING_LABELS[sr.rating as keyof typeof RATING_LABELS]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowSummary(false)}
                  className="px-4 py-2 border border-gray-300 rounded-[4px] text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-800 text-gray-800 rounded-[4px]"
                >
                  {loading ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status messages */}
        {status === 'success' && (
          <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-[4px] flex items-center gap-2">
            <CheckCircle size={18} /> Submitted successfully
          </div>
        )}
        {status === 'error' && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-2 rounded-[4px] flex items-center gap-2">
            <AlertCircle size={18} /> Error submitting form
          </div>
        )}
      </div>
    </div>
  );
}
