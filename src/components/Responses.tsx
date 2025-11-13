import { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Edit2,
  Save,
  X,
  Loader,
  RefreshCw,
  Download,
  SlidersHorizontal,
  Columns
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

const ALL_SKILLS = Object.values(SKILL_SECTIONS).flatMap(s => s.skills);

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

  // Filters & UI state — only search kept
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // <-- initially hidden now

  // build ordered allColumnKeys including section headers + skill subheaders
  const allColumnKeys = useMemo(() => {
    // order: number, name, employee_id, email, for each section -> section_key, skill..., then additional_skills, timestamp, actions
    const keys: string[] = ['number', 'name', 'employee_id', 'email'];
    Object.keys(SKILL_SECTIONS).forEach(sectionKey => {
      keys.push(`section_${sectionKey}`);
      keys.push(...(SKILL_SECTIONS as any)[sectionKey].skills);
    });
    keys.push('additional_skills', 'timestamp', 'actions');
    return keys;
  }, []);

  // initialize visible columns on mount (all true)
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    // default visible for data columns
    initial['number'] = true;
    initial['name'] = true;
    initial['employee_id'] = true;
    initial['email'] = true;
    Object.keys(SKILL_SECTIONS).forEach(sectionKey => {
      initial[`section_${sectionKey}`] = true; // section header toggle
      (SKILL_SECTIONS as any)[sectionKey].skills.forEach((skill: string) => {
        initial[skill] = true;
      });
    });
    initial['additional_skills'] = true;
    initial['timestamp'] = true;
    initial['actions'] = true;
    setVisibleColumns(initial);
  }, []);

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
      setError(`Failed to load responses: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (response: EmployeeResponse) => {
    setEditingId(response._id || null);
    // deep copy so we can edit locally
    setEditData({
      ...response,
      skill_ratings: response.skill_ratings.map(sr => ({ ...sr }))
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.deleteResponse(id);
      setResponses(prev => prev.filter((r) => r._id !== id));
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
        r._id === id ? ({ ...(r as any), ...(editData as any), _id: id } as EmployeeResponse) : r
      );
      setResponses(updated);
      setEditingId(null);
      setEditData({});
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
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  // Filtered responses (memoized) — only searchTerm applied
  const filteredResponses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.employee_id.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  }, [responses, searchTerm]);

  // toggleColumn: if toggling a section header, toggle all subskills in it.
  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = { ...prev };
      const current = !!prev[key];
      const newVal = !current;
      next[key] = newVal;

      if (key.startsWith('section_')) {
        // toggle all skills in the section
        const sectionKey = key.replace('section_', '');
        const skills: string[] = (SKILL_SECTIONS as any)[sectionKey].skills || [];
        skills.forEach(s => {
          next[s] = newVal;
        });
      } else {
        // If toggling a skill, try to sync its section header: header should be true only if all skills true
        const sectionEntry = Object.entries(SKILL_SECTIONS).find(([_, sec]: any) => sec.skills.includes(key));
        if (sectionEntry) {
          const sectionKey = sectionEntry[0];
          const skills: string[] = sectionEntry[1].skills;
          // apply new value to this skill
          next[key] = newVal;
          const allOn = skills.every(s => next[s]);
          next[`section_${sectionKey}`] = allOn;
        } else {
          next[key] = newVal;
        }
      }

      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
  };

  // Excel export (styled) using SheetJS (xlsx)
  // Hides 'timestamp' and 'actions' columns per your request.
  const downloadExcel = () => {
    // visible data keys: exclude section_*, timestamp, actions
    const visibleDataKeys = allColumnKeys.filter(
      k => visibleColumns[k] && !k.startsWith('section_') && k !== 'timestamp' && k !== 'actions'
    );

    if (visibleDataKeys.length === 0) {
      alert('No columns selected to export.');
      return;
    }

    // Build header row (friendly names)
    const header = visibleDataKeys.map(k => {
      if (k === 'number') return 'No.';
      if (k === 'employee_id') return 'Emp ID';
      if (k === 'additional_skills') return 'Additional Skills';
      return k === 'name' ? 'Name' : k === 'email' ? 'Email' : k;
    });

    // Build rows
    const rows = filteredResponses.map((r, idx) => {
      const row: (string | number)[] = [];
      for (const key of visibleDataKeys) {
        if (key === 'number') row.push(idx + 1);
        else if (key === 'name') row.push(r.name);
        else if (key === 'employee_id') row.push(r.employee_id);
        else if (key === 'email') row.push(r.email);
        else if (key === 'additional_skills') row.push(r.additional_skills || '');
        else {
          // skill column => number value or blank
          const ratingObj = r.skill_ratings.find(sr => sr.skill === key);
          row.push(ratingObj ? ratingObj.rating : '');
        }
      }
      return row;
    });

    // Create worksheet from arrays (header + rows)
    const aoa = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Apply simple styling to header row (A1..)
    // Note: community SheetJS accepts .s on cells but some viewers may ignore styles.
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
      const cell = ws[cellAddress];
      if (cell) {
        // @ts-ignore - assign style (cell.s). Some bundlers might strip types; ensure xlsx is installed.
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: 'FF1F2937' } }, // a dark slate header background
          alignment: { vertical: 'center', horizontal: 'center' }
        };
      }
    }

    // Optional: auto-width columns (simple heuristic)
    const colWidths = header.map((h, i) => {
      let max = String(h).length;
      for (let r = 0; r < rows.length; ++r) {
        const v = rows[r][i];
        const len = v ? String(v).length : 0;
        if (len > max) max = len;
      }
      // width in characters + padding
      return { wch: Math.min(Math.max(max + 2, 10), 40) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    const now = new Date();
    const filename = `responses_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.xlsx`;

    // write with cellStyles true (may be needed for some styling)
    XLSX.writeFile(wb, filename, { bookType: 'xlsx', bookSST: false, cellStyles: true });
  };

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
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Responses</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowFilters(s => !s); }}
              title="Show / hide filters"
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline text-sm">Filters</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowColumnsDropdown(s => !s)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                title="Toggle columns"
              >
                <Columns size={16} />
                <span className="hidden sm:inline text-sm">Columns</span>
              </button>

              {showColumnsDropdown && (
                <div className="absolute z-20 mt-2 right-0 w-80 bg-white border rounded shadow-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <strong>Visible columns</strong>
                    <button
                      onClick={() => {
                        // toggle all
                        const allOn = allColumnKeys.every(k => visibleColumns[k]);
                        const next: Record<string, boolean> = { ...visibleColumns };
                        allColumnKeys.forEach(k => (next[k] = !allOn));
                        setVisibleColumns(next);
                      }}
                      className="text-xs text-blue-600"
                    >
                      Toggle all
                    </button>
                  </div>

                  <div className="max-h-64 overflow-auto">
                    {/* show section headers + subskills */}
                    {Object.entries(SKILL_SECTIONS).map(([sectionKey, section]: any) => (
                      <div key={`group-${sectionKey}`} className="mb-2">
                        <label className="flex items-center gap-2 text-sm py-1">
                          <input
                            type="checkbox"
                            checked={!!visibleColumns[`section_${sectionKey}`]}
                            onChange={() => toggleColumn(`section_${sectionKey}`)}
                            className="rounded"
                          />
                          <span className="font-medium">{section.title} (header)</span>
                        </label>

                        <div className="ml-5">
                          {section.skills.map((skill: string) => (
                            <label key={skill} className="flex items-center gap-2 text-sm py-1">
                              <input
                                type="checkbox"
                                checked={!!visibleColumns[skill]}
                                onChange={() => toggleColumn(skill)}
                                className="rounded"
                              />
                              <span>{skill}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* other columns */}
                    <label className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns['number']}
                        onChange={() => toggleColumn('number')}
                        className="rounded"
                      />
                      <span>No.</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns['additional_skills']}
                        onChange={() => toggleColumn('additional_skills')}
                        className="rounded"
                      />
                      <span>Additional Skills</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns['timestamp']}
                        onChange={() => toggleColumn('timestamp')}
                        className="rounded"
                      />
                      <span>Submitted</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns['actions']}
                        onChange={() => toggleColumn('actions')}
                        className="rounded"
                      />
                      <span>Actions</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
            title="Export visible rows to XLSX (Submitted & Actions excluded)"
          >
            <Download size={16} /> Export to Excel
          </button>

          <button
            onClick={loadResponses}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 flex flex-col md:flex-row gap-3 items-center">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search name, emp id or email..."
            className="p-2 border rounded-md w-full md:w-1/3"
          />

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {visibleColumns['number'] && (
                <th className="px-6 py-4 bg-gray-100 text-left font-semibold border">No.</th>
              )}
              {visibleColumns['name'] && (
                <th className="px-6 py-4 bg-gray-100 text-left font-semibold border">Name</th>
              )}
              {visibleColumns['employee_id'] && (
                <th className="px-6 py-4 bg-gray-100 text-left font-semibold border">Emp ID</th>
              )}
              {visibleColumns['email'] && (
                <th className="px-6 py-4 bg-gray-100 text-left font-semibold border">Email</th>
              )}

              {/* Skill section headers (show a header th with colSpan equal to visible skills count).
                  If header toggle is off but subheaders visible we render an empty header cell to keep alignment. */}
              {Object.entries(SKILL_SECTIONS).map(([sectionKey, section]: any, idx) => {
                const visibleSkillCount = section.skills.filter((s: string) => visibleColumns[s]).length;
                if (visibleSkillCount === 0) return null;

                const headerVisible = !!visibleColumns[`section_${sectionKey}`];
                return (
                  <th
                    key={`header-${idx}`}
                    colSpan={visibleSkillCount}
                    className={`px-6 py-3 text-center font-semibold text-white border bg-gradient-to-r ${section.color}`}
                  >
                    {headerVisible ? section.title : <span className="text-xs text-white/40"> </span>}
                  </th>
                );
              })}

              {visibleColumns['additional_skills'] && (
                <th className="px-6 py-4 bg-gray-100 font-semibold border">Additional Skills</th>
              )}
              {visibleColumns['timestamp'] && (
                <th className="px-6 py-4 bg-gray-100 font-semibold border">Submitted</th>
              )}
              {visibleColumns['actions'] && (
                <th className="px-6 py-4 bg-gray-100 font-semibold border text-center">Actions</th>
              )}
            </tr>

            {/* Subheader skills row */}
            <tr className="bg-gray-50">
              {visibleColumns['number'] && <th className="px-4 py-2 text-xs font-semibold border" />}
              {visibleColumns['name'] && <th className="px-4 py-2 text-xs font-semibold border" />}
              {visibleColumns['employee_id'] && <th className="px-4 py-2 text-xs font-semibold border" />}
              {visibleColumns['email'] && <th className="px-4 py-2 text-xs font-semibold border" />}

              {Object.values(SKILL_SECTIONS).flatMap((section) =>
                section.skills
                  .filter(skill => visibleColumns[skill])
                  .map((skill, i) => (
                    <th
                      key={`${section.title}-sub-${i}`}
                      className="px-4 py-2 text-xs font-semibold text-gray-700 border text-center"
                    >
                      {skill}
                    </th>
                  ))
              )}

              {visibleColumns['additional_skills'] && (
                <th className="px-4 py-2 text-xs font-semibold border" />
              )}
              {visibleColumns['timestamp'] && <th className="px-4 py-2 text-xs font-semibold border" />}
              {visibleColumns['actions'] && <th className="px-4 py-2 text-xs font-semibold border" />}
            </tr>
          </thead>

          <tbody>
            {filteredResponses.map((response, idx) => {
              const isEditing = editingId === response._id;

              return (
                <tr
                  key={response._id}
                  className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {visibleColumns['number'] && (
                    <td className="px-6 py-3 font-medium text-gray-900 border">{idx + 1}</td>
                  )}

                  {visibleColumns['name'] && (
                    <td className="px-6 py-3 font-medium text-gray-900 border">{response.name}</td>
                  )}

                  {visibleColumns['employee_id'] && (
                    <td className="px-6 py-3 text-gray-700 border">{response.employee_id}</td>
                  )}

                  {visibleColumns['email'] && (
                    <td className="px-6 py-3 text-gray-700 border">{response.email}</td>
                  )}

                  {Object.values(SKILL_SECTIONS).flatMap((section) =>
                    section.skills
                      .filter(skill => visibleColumns[skill])
                      .map((skill) => {
                        const ratingObj = isEditing
                          ? (editData.skill_ratings || []).find((r) => r.skill === skill)
                          : response.skill_ratings.find((r) => r.skill === skill);

                        return (
                          <td
                            key={`${response._id}-${section.title}-${skill}`}
                            className="px-4 py-2 border text-center"
                          >
                            {isEditing ? (
                              <select
                                value={ratingObj?.rating || 0}
                                onChange={(e) => handleRatingChange(skill, parseInt(e.target.value))}
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

                  {visibleColumns['additional_skills'] && (
                    <td className="px-6 py-3 text-sm text-gray-600 border">
                      {response.additional_skills || '—'}
                    </td>
                  )}

                  {visibleColumns['timestamp'] && (
                    <td className="px-6 py-3 text-sm text-gray-500 border">
                      {formatDate(response.timestamp)}
                    </td>
                  )}

                  {visibleColumns['actions'] && (
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
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation (simple inline modal) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold">Delete response?</h3>
            <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
