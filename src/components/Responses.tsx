import { useState, useEffect } from 'react';
import { Trash2, Edit2, Save, X, Loader, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

const RATING_LABELS: Record<number, string> = {
  1: 'No Knowledge',
  2: 'Novice',
  3: 'Proficient',
  4: 'Expert',
  5: 'Advanced'
};

const SKILL_SECTIONS = {
  programming: {
    title: 'Programming Skills',
    color: 'from-sky-400 to-emerald-400',
    skills: ['Python', 'C++', 'Java', 'JavaScript', 'C', 'PySpark']
  },
  dataAnalytics: {
    title: 'Data Analytics',
    color: 'from-amber-400 to-pink-400',
    skills: ['Power BI / Tableau', 'Visualization Libraries', 'SQL', 'NoSQL']
  },
  dataScience: {
    title: 'Data Science',
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
    color: 'from-teal-400 to-green-400',
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js']
  },
  devops: {
    title: 'DevOps',
    color: 'from-gray-400 to-slate-500',
    skills: ['Jenkins', 'CI/CD', 'Kubernetes', 'Docker']
  }
};

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

export default function Responses() {
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeResponse>>({});
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getResponses();
      if (Array.isArray(data)) setResponses(data);
      else setError('Invalid data format received from server');
    } catch (err: any) {
      setError(`Failed to load responses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (response: EmployeeResponse) => {
    setEditingId(response._id || null);
    setEditData({ ...response });
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.deleteResponse(id);
      setResponses(responses.filter((r) => r._id !== id));
      setShowDeleteModal(null);
    } catch {
      setError('Failed to delete response');
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await api.updateResponse(id, editData);
      const updated = responses.map((r) =>
        r._id === id ? ({ ...editData, timestamp: r.timestamp, _id: id } as EmployeeResponse) : r
      );
      setResponses(updated);
      setEditingId(null);
    } catch {
      setError('Failed to update response');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleRatingChange = (skill: string, newRating: number) => {
    if (!editData.skill_ratings) return;
    const updatedRatings = editData.skill_ratings.map((r) =>
      r.skill === skill ? { ...r, rating: newRating } : r
    );
    setEditData({ ...editData, skill_ratings: updatedRatings });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading responses...</span>
      </div>
    );

  if (error)
    return (
      <div className="text-red-600 bg-red-50 p-6 rounded-lg">
        <p>{error}</p>
        <button
          onClick={loadResponses}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );

  if (responses.length === 0)
    return <p className="text-center text-gray-500 mt-12">No responses yet.</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800"></h2>
        <button
          onClick={loadResponses}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full border-collapse text-sm">
          {/* Multi-level header */}
          <thead>
            <tr>
              <th rowSpan={2} className="px-6 py-4 bg-gray-100 text-left font-semibold border">
                Name
              </th>
              <th rowSpan={2} className="px-6 py-4 bg-gray-100 text-left font-semibold border">
                Emp ID
              </th>
              <th rowSpan={2} className="px-6 py-4 bg-gray-100 text-left font-semibold border">
                Email
              </th>

              {Object.values(SKILL_SECTIONS).map((section, idx) => (
                <th
                  key={`header-${idx}`}
                  colSpan={section.skills.length}
                  className={`px-6 py-3 text-center font-semibold text-white border bg-gradient-to-r ${section.color}`}
                >
                  {section.title}
                </th>
              ))}

              <th rowSpan={2} className="px-6 py-4 bg-gray-100 font-semibold border">
                Additional Skills
              </th>
              <th rowSpan={2} className="px-6 py-4 bg-gray-100 font-semibold border">
                Submitted
              </th>
              <th rowSpan={2} className="px-6 py-4 bg-gray-100 font-semibold border text-center">
                Actions
              </th>
            </tr>

            {/* Subheader Row */}
            <tr className="bg-gray-50">
              {Object.values(SKILL_SECTIONS).flatMap((section) =>
                section.skills.map((skill, i) => (
                  <th
                    key={`${section.title}-sub-${i}`}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 border text-center"
                  >
                    {skill}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {responses.map((response) => {
              const isEditing = editingId === response._id;

              return (
                <tr
                  key={response._id}
                  className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-900 border">{response.name}</td>
                  <td className="px-6 py-3 text-gray-700 border">{response.employee_id}</td>
                  <td className="px-6 py-3 text-gray-700 border">{response.email}</td>

                  {Object.values(SKILL_SECTIONS).flatMap((section) =>
                    section.skills.map((skill) => {
                      const ratingObj = isEditing
                        ? editData.skill_ratings?.find((r) => r.skill === skill)
                        : response.skill_ratings.find((r) => r.skill === skill);

                      return (
                        <td
                          key={`${response._id}-${section.title}-${skill}`}
                          className="px-4 py-2 border text-center"
                        >
                          {isEditing ? (
                            <select
                              value={ratingObj?.rating || 0}
                              onChange={(e) =>
                                handleRatingChange(skill, parseInt(e.target.value))
                              }
                              className="border-gray-300 rounded text-xs px-2 py-1"
                            >
                              <option value={0}>Select</option>
                              {Object.entries(RATING_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : ratingObj ? (
                            <span className="text-gray-800 text-xs font-medium">
                              {RATING_LABELS[ratingObj.rating]} ({ratingObj.rating})
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      );
                    })
                  )}

                  <td className="px-6 py-3 text-sm text-gray-600 border">
                    {response.additional_skills || '—'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 border">
                    {formatDate(response.timestamp)}
                  </td>
                  <td className="px-6 py-3 border text-center">
                    <div className="flex justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(response._id!)}
                            className="p-1.5 rounded text-green-600 hover:bg-green-100 transition"
                            title="Save"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(response)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(response._id!)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-100 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
