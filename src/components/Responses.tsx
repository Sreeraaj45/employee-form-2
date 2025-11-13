import { useEffect, useMemo, useState, useRef } from 'react';
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

  // UI + filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // hidden initially

  // header order state (top-level headers). Section keys are used as 'section_<key>'
  const [headerOrder, setHeaderOrder] = useState<string[]>([]);
  // sub-order per section: sectionKey -> array of skills in order
  const [subOrder, setSubOrder] = useState<Record<string, string[]>>({});

  const dragHeaderId = useRef<string | null>(null);
  const dragSubSkill = useRef<{ section: string; skill: string } | null>(null);

  // Build initial headerOrder and subOrder
  const initialHeaderOrder = useMemo(() => {
    const keys: string[] = ['number', 'name', 'employee_id', 'email'];
    Object.keys(SKILL_SECTIONS).forEach(sectionKey => {
      keys.push(`section_${sectionKey}`);
    });
    keys.push('additional_skills', 'timestamp', 'actions');
    return keys;
  }, []);

  useEffect(() => {
    // initialize visible columns and subOrder and header order
    const initialVisible: Record<string, boolean> = {};
    initialVisible['number'] = true;
    initialVisible['name'] = true;
    initialVisible['employee_id'] = true;
    initialVisible['email'] = true;

    const initialSubOrder: Record<string, string[]> = {};
    Object.entries(SKILL_SECTIONS).forEach(([sectionKey, section]: any) => {
      initialVisible[`section_${sectionKey}`] = true;
      initialSubOrder[sectionKey] = [...section.skills];
      section.skills.forEach((skill: string) => {
        initialVisible[skill] = true;
      });
    });

    initialVisible['additional_skills'] = true;
    initialVisible['timestamp'] = true;
    initialVisible['actions'] = true;

    setVisibleColumns(initialVisible);
    setSubOrder(initialSubOrder);
    setHeaderOrder(initialHeaderOrder);
  }, [initialHeaderOrder]);

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

  // filtered responses (search only)
  const filteredResponses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.employee_id.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  }, [responses, searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
  };

  // toggle column visibility. section header toggles all its subskills
  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = { ...prev };
      const newVal = !prev[key];
      next[key] = newVal;
      if (key.startsWith('section_')) {
        const sectionKey = key.replace('section_', '');
        (SKILL_SECTIONS as any)[sectionKey].skills.forEach((s: string) => (next[s] = newVal));
      } else {
        // if it's a subskill, update section header state
        const sectionEntry = Object.entries(SKILL_SECTIONS).find(([_, sec]: any) =>
          sec.skills.includes(key)
        );
        if (sectionEntry) {
          const sectionKey = sectionEntry[0];
          const skills: string[] = sectionEntry[1].skills;
          next[key] = newVal;
          const allOn = skills.every(s => next[s]);
          next[`section_${sectionKey}`] = allOn;
        }
      }
      return next;
    });
  };

  // ----- Drag & drop: headers -----
  const handleHeaderDragStart = (e: React.DragEvent, headerId: string) => {
    dragHeaderId.current = headerId;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleHeaderDrop = (e: React.DragEvent, targetHeaderId: string) => {
    e.preventDefault();
    const dragged = dragHeaderId.current;
    if (!dragged || dragged === targetHeaderId) return;
    setHeaderOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(dragged);
      const to = next.indexOf(targetHeaderId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragged);
      return next;
    });
    dragHeaderId.current = null;
  };

  // ----- Drag & drop: subheaders within a section -----
  const handleSubDragStart = (e: React.DragEvent, sectionKey: string, skill: string) => {
    dragSubSkill.current = { section: sectionKey, skill };
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleSubDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleSubDrop = (e: React.DragEvent, sectionKey: string, targetSkill: string) => {
    e.preventDefault();
    const dragged = dragSubSkill.current;
    if (!dragged) return;
    if (dragged.section !== sectionKey) return; // only allow within same section
    if (dragged.skill === targetSkill) return;
    setSubOrder(prev => {
      const arr = [...(prev[sectionKey] || [])];
      const from = arr.indexOf(dragged.skill);
      const to = arr.indexOf(targetSkill);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, dragged.skill);
      return { ...prev, [sectionKey]: arr };
    });
    dragSubSkill.current = null;
  };

  // ----- Excel export (styled) using SheetJS -----
  // Export respects headerOrder and subOrder and visibleColumns.
  // Excludes timestamp and actions. Formats ratings as "Label (5)".
  const downloadExcel = () => {
    // Build visible keys in order based on headerOrder & subOrder
    const visibleKeysOrdered: string[] = [];
    headerOrder.forEach(h => {
      if (h.startsWith('section_')) {
        const sectionKey = h.replace('section_', '');
        const skills = subOrder[sectionKey] || [];
        skills.forEach(skill => {
          if (visibleColumns[skill]) visibleKeysOrdered.push(skill);
        });
      } else {
        // plain column
        if (visibleColumns[h]) visibleKeysOrdered.push(h);
      }
    });

    // Exclude timestamp & actions from export
    const exportKeys = visibleKeysOrdered.filter(k => k !== 'timestamp' && k !== 'actions');

    if (exportKeys.length === 0) {
      alert('No columns selected to export.');
      return;
    }

    // Build two header rows: main headers (merged over their subcolumns) and subheaders
    const headerRow1: string[] = [];
    const headerRow2: string[] = [];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

    let colIndex = 0;
    headerOrder.forEach(h => {
      // If section -> count how many of its skills are included in exportKeys (and visible)
      if (h.startsWith('section_')) {
        const sectionKey = h.replace('section_', '');
        const skills = subOrder[sectionKey] || [];
        const visibleSkills = skills.filter(s => exportKeys.includes(s));
        const span = visibleSkills.length;
        if (span === 0) return; // nothing from this section exported

        // main header cell
        headerRow1.push((SKILL_SECTIONS as any)[sectionKey].title);
        // if there will be multiple subcolumns, we merge header cells across them
        if (span > 1) {
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + span - 1 } });
        }
        // subheaders: push each skill name
        visibleSkills.forEach(skill => {
          headerRow2.push(skill);
        });
        colIndex += span;
      } else {
        // simple column exported?
        if (!exportKeys.includes(h)) return;
        // main header row: friendly name
        const friendly =
          h === 'number'
            ? 'No.'
            : h === 'employee_id'
            ? 'Emp ID'
            : h === 'additional_skills'
            ? 'Additional Skills'
            : h === 'name'
            ? 'Name'
            : h === 'email'
            ? 'Email'
            : h;
        headerRow1.push(friendly);
        // subheader gets an empty string for alignment (so second row exists)
        headerRow2.push('');
        // no merge needed for single column (span 1)
        colIndex += 1;
      }
    });

    // Build data rows matching exportKeys (which follow headerOrder/subOrder order)
    const dataRows = filteredResponses.map((r, idx) => {
      return exportKeys.map(k => {
        if (k === 'number') return idx + 1;
        if (k === 'name') return r.name;
        if (k === 'employee_id') return r.employee_id;
        if (k === 'email') return r.email;
        if (k === 'additional_skills') return r.additional_skills || '';
        // skill -> format label (rating)
        const ratingObj = r.skill_ratings.find(sr => sr.skill === k);
        if (ratingObj) {
          const label = RATING_LABELS[ratingObj.rating] || '';
          return `${label} (${ratingObj.rating})`;
        }
        return '';
      });
    });

    // Use AOA with two header rows
    const aoa = [headerRow1, headerRow2, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Attach merges so main headers are merged where appropriate
    if (!ws['!merges']) ws['!merges'] = [];
    (ws['!merges'] as any[]).push(...merges);

    // Apply style to header rows (both)
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      // Header row 1 cell style
      const cellAddr1 = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell1 = ws[cellAddr1];
      if (cell1) {
        // @ts-ignore
        cell1.s = {
          font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: 'FF0F172A' } }, // dark header
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'FF9CA3AF' } },
            bottom: { style: 'thin', color: { rgb: 'FF9CA3AF' } },
            left: { style: 'thin', color: { rgb: 'FF9CA3AF' } },
            right: { style: 'thin', color: { rgb: 'FF9CA3AF' } }
          }
        };
      }
      // Header row 2 cell style (subheader)
      const cellAddr2 = XLSX.utils.encode_cell({ r: 1, c: C });
      const cell2 = ws[cellAddr2];
      if (cell2) {
        // @ts-ignore
        cell2.s = {
          font: { bold: true, color: { rgb: 'FF0F172A' }, sz: 11 },
          fill: { fgColor: { rgb: 'FFD1D5DB' } }, // lighter background for subheader
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'FF9CA3AF' } },
            bottom: { style: 'thin', color: { rgb: 'FF9CA3AF' } },
            left: { style: 'thin', color: { rgb: 'FF9CA3AF' } },
            right: { style: 'thin', color: { rgb: 'FF9CA3AF' } }
          }
        };
      }
    }

    // Style data rows (alternate fill)
    for (let R = 2; R <= 2 + dataRows.length - 1; ++R) {
      const isEven = (R - 2) % 2 === 0;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (cell) {
          // @ts-ignore
          cell.s = {
            ...(cell.s || {}),
            fill: { fgColor: { rgb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } },
            alignment: { vertical: 'center', horizontal: 'left' }
          };
        }
      }
    }

    // Column widths heuristic
    const headerCombined = headerRow1.map((h, i) => {
      // prefer subheader if present (skill names)
      const sub = headerRow2[i];
      return sub && sub.length > 0 ? sub : h;
    });
    const colWidths = headerCombined.map((h, i) => {
      let max = String(h).length;
      for (let r = 0; r < dataRows.length; ++r) {
        const v = dataRows[r][i];
        const len = v ? String(v).length : 0;
        if (len > max) max = len;
      }
      return { wch: Math.min(Math.max(max + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;

    // set row heights for header rows (optional)
    ws['!rows'] = [{ hpt: 22 }, { hpt: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    const now = new Date();
    const filename = `responses_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.xlsx`;

    XLSX.writeFile(wb, filename, { bookType: 'xlsx', bookSST: false, cellStyles: true });
  };

  // Helpers for rendering: check if section has any visible subskills
  const sectionVisibleCount = (sectionKey: string) => {
    const skills = subOrder[sectionKey] || [];
    return skills.filter(s => visibleColumns[s]).length;
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
      {/* Header + controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Responses</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(s => !s)}
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
                <div className="absolute z-30 mt-2 right-0 w-96 bg-white border rounded shadow-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <strong>Visible columns</strong>
                    <button
                      onClick={() => {
                        const allOn = headerOrder.every(k => visibleColumns[k] !== false);
                        const next: Record<string, boolean> = { ...visibleColumns };
                        // toggle all top-level and subskills
                        Object.keys(next).forEach(k => (next[k] = !allOn));
                        setVisibleColumns(next);
                      }}
                      className="text-xs text-blue-600"
                    >
                      Toggle all
                    </button>
                  </div>

                  <div className="max-h-64 overflow-auto">
                    {/* number + basic cols */}
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
                        checked={!!visibleColumns['name']}
                        onChange={() => toggleColumn('name')}
                        className="rounded"
                      />
                      <span>Name</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns['employee_id']}
                        onChange={() => toggleColumn('employee_id')}
                        className="rounded"
                      />
                      <span>Emp ID</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns['email']}
                        onChange={() => toggleColumn('email')}
                        className="rounded"
                      />
                      <span>Email</span>
                    </label>

                    <hr className="my-2" />

                    {/* show sections + subskills */}
                    {Object.entries(SKILL_SECTIONS).map(([sectionKey, section]: any) => (
                      <div key={sectionKey} className="mb-2">
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
                          {(subOrder[sectionKey] || []).map((skill: string) => (
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

                    <hr className="my-2" />

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

      {/* Table container with vertical scrolling so sticky headers work */}
      <div className="bg-white rounded-lg shadow-lg overflow-auto border border-gray-200 max-h-[70vh]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            {/* Header row - sticky */}
            <tr>
              {headerOrder.map((hdr) => {
                // plain columns
                if (hdr === 'number' && visibleColumns['number']) {
                  return (
                    <th
                      key="number"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'number')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'number')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 text-left font-semibold border cursor-move"
                    >
                      No.
                    </th>
                  );
                }
                if (hdr === 'name' && visibleColumns['name']) {
                  return (
                    <th
                      key="name"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'name')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'name')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 text-left font-semibold border cursor-move"
                    >
                      Name
                    </th>
                  );
                }
                if (hdr === 'employee_id' && visibleColumns['employee_id']) {
                  return (
                    <th
                      key="employee_id"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'employee_id')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'employee_id')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 text-left font-semibold border cursor-move"
                    >
                      Emp ID
                    </th>
                  );
                }
                if (hdr === 'email' && visibleColumns['email']) {
                  return (
                    <th
                      key="email"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'email')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'email')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 text-left font-semibold border cursor-move"
                    >
                      Email
                    </th>
                  );
                }

                // sections
                if (hdr.startsWith('section_')) {
                  const sectionKey = hdr.replace('section_', '');
                  const visibleCount = sectionVisibleCount(sectionKey);
                  if (visibleCount === 0) return null;
                  const headerVisible = !!visibleColumns[`section_${sectionKey}`];
                  const section = (SKILL_SECTIONS as any)[sectionKey];
                  return (
                    <th
                      key={hdr}
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, hdr)}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, hdr)}
                      colSpan={visibleCount}
                      className={`sticky top-0 z-20 px-6 py-3 text-center font-semibold text-white border bg-gradient-to-r ${section.color} cursor-move`}
                    >
                      {headerVisible ? section.title : <span className="text-xs text-white/40"> </span>}
                    </th>
                  );
                }

                // other simple columns
                if (hdr === 'additional_skills' && visibleColumns['additional_skills']) {
                  return (
                    <th
                      key="additional_skills"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'additional_skills')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'additional_skills')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 font-semibold border cursor-move"
                    >
                      Additional Skills
                    </th>
                  );
                }
                if (hdr === 'timestamp' && visibleColumns['timestamp']) {
                  return (
                    <th
                      key="timestamp"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'timestamp')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'timestamp')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 font-semibold border cursor-move"
                    >
                      Submitted
                    </th>
                  );
                }
                if (hdr === 'actions' && visibleColumns['actions']) {
                  return (
                    <th
                      key="actions"
                      draggable
                      onDragStart={(e) => handleHeaderDragStart(e, 'actions')}
                      onDragOver={handleHeaderDragOver}
                      onDrop={(e) => handleHeaderDrop(e, 'actions')}
                      className="sticky top-0 z-20 px-6 py-4 bg-gray-100 font-semibold border text-center cursor-move"
                    >
                      Actions
                    </th>
                  );
                }

                return null;
              })}
            </tr>

            {/* Subheader row - sticky below header */}
            {/* NOTE: top value tuned to below header; adjust if header height changes */}
            <tr className="bg-gray-50">
              {headerOrder.map(hdr => {
                if (hdr === 'number' && visibleColumns['number']) return <th key="num-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;
                if (hdr === 'name' && visibleColumns['name']) return <th key="name-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;
                if (hdr === 'employee_id' && visibleColumns['employee_id']) return <th key="emp-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;
                if (hdr === 'email' && visibleColumns['email']) return <th key="email-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;

                if (hdr.startsWith('section_')) {
                  const sectionKey = hdr.replace('section_', '');
                  const skills = subOrder[sectionKey] || [];
                  // render each visible subskill in this header in its order
                  return skills
                    .filter(s => visibleColumns[s])
                    .map(skill => (
                      <th
                        key={`${sectionKey}-${skill}`}
                        draggable
                        onDragStart={(e) => handleSubDragStart(e, sectionKey, skill)}
                        onDragOver={handleSubDragOver}
                        onDrop={(e) => handleSubDrop(e, sectionKey, skill)}
                        className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold text-gray-700 border text-center cursor-move"
                      >
                        {skill}
                      </th>
                    ));
                }

                if (hdr === 'additional_skills' && visibleColumns['additional_skills']) {
                  return <th key="add-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;
                }
                if (hdr === 'timestamp' && visibleColumns['timestamp']) {
                  return <th key="time-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;
                }
                if (hdr === 'actions' && visibleColumns['actions']) {
                  return <th key="act-sub" className="sticky top-12 z-10 px-4 py-2 text-xs font-semibold border" />;
                }

                return null;
              })}
            </tr>
          </thead>

          <tbody>
            {filteredResponses.map((response, idx) => {
              const isEditing = editingId === response._id;
              return (
                <tr key={response._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                  {headerOrder.map(hdr => {
                    // for sections, list subskills (visible ones) in subOrder order
                    if (hdr === 'number') {
                      if (!visibleColumns['number']) return null;
                      return <td key={`num-${response._id}`} className="px-6 py-3 font-medium text-gray-900 border">{idx + 1}</td>;
                    }
                    if (hdr === 'name') {
                      if (!visibleColumns['name']) return null;
                      return <td key={`name-${response._id}`} className="px-6 py-3 font-medium text-gray-900 border">{response.name}</td>;
                    }
                    if (hdr === 'employee_id') {
                      if (!visibleColumns['employee_id']) return null;
                      return <td key={`emp-${response._id}`} className="px-6 py-3 text-gray-700 border">{response.employee_id}</td>;
                    }
                    if (hdr === 'email') {
                      if (!visibleColumns['email']) return null;
                      return <td key={`email-${response._id}`} className="px-6 py-3 text-gray-700 border">{response.email}</td>;
                    }

                    if (hdr.startsWith('section_')) {
                      const sectionKey = hdr.replace('section_', '');
                      const skills = subOrder[sectionKey] || [];
                      return skills
                        .filter(s => visibleColumns[s])
                        .map(skill => {
                          const ratingObj = isEditing
                            ? (editData.skill_ratings || []).find((r) => r.skill === skill)
                            : response.skill_ratings.find((r) => r.skill === skill);

                          return (
                            <td key={`${response._id}-${sectionKey}-${skill}`} className="px-4 py-2 border text-center">
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
                        });
                    }

                    if (hdr === 'additional_skills') {
                      if (!visibleColumns['additional_skills']) return null;
                      return <td key={`add-${response._id}`} className="px-6 py-3 text-sm text-gray-600 border">{response.additional_skills || '—'}</td>;
                    }

                    if (hdr === 'timestamp') {
                      if (!visibleColumns['timestamp']) return null;
                      return <td key={`time-${response._id}`} className="px-6 py-3 text-sm text-gray-500 border">{formatDate(response.timestamp)}</td>;
                    }

                    if (hdr === 'actions') {
                      if (!visibleColumns['actions']) return null;
                      return (
                        <td key={`act-${response._id}`} className="px-6 py-3 border text-center">
                          <div className="flex justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => saveEdit(response._id!)} className="p-1.5 rounded text-green-600 hover:bg-green-100 transition" title="Save"><Save size={16} /></button>
                                <button onClick={cancelEdit} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition" title="Cancel"><X size={16} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(response)} className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition" title="Edit"><Edit2 size={16} /></button>
                                <button onClick={() => setShowDeleteModal(response._id!)} className="p-1.5 rounded text-red-600 hover:bg-red-100 transition" title="Delete"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      );
                    }

                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold">Delete response?</h3>
            <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowDeleteModal(null)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleDelete(showDeleteModal)} className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
