import { useState, useEffect } from 'react';
import { Trash2, Edit2, Save, X, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmployeeResponse {
  name: string;
  employeeId: string;
  email: string;
  selectedSkills: string[];
  skillRatings: Array<{ skill: string; rating: number }>;
  additionalSkills: string;
  timestamp: string;
}

export default function Responses() {
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeResponse>>({});
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_responses')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(row => ({
        name: row.name,
        employeeId: row.employee_id,
        email: row.email,
        selectedSkills: row.selected_skills || [],
        skillRatings: row.skill_ratings || [],
        additionalSkills: row.additional_skills || '',
        timestamp: row.timestamp,
        id: row.id
      })) as (EmployeeResponse & { id: string })[];

      setResponses(formattedData);
    } catch (err) {
      console.error('Error loading responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('employee_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setResponses(responses.filter(r => (r as any).id !== id));
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Error deleting response:', err);
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (response: EmployeeResponse) => {
    setEditingId((response as any).id);
    setEditData({ ...response });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_responses')
        .update({
          name: editData.name,
          employee_id: editData.employeeId,
          email: editData.email,
          selected_skills: editData.selectedSkills,
          skill_ratings: editData.skillRatings,
          additional_skills: editData.additionalSkills
        })
        .eq('id', id);

      if (error) throw error;

      const updated = responses.map(r =>
        (r as any).id === id ? { ...editData, timestamp: r.timestamp, id } : r
      );
      setResponses(updated);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating response:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Responses</h2>
          <p className="text-gray-600 mt-1">Employee form responses</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center gap-3">
          <Loader size={24} className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading responses...</span>
        </div>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Responses</h2>
          <p className="text-gray-600 mt-1">Employee form responses</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No responses yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Responses</h2>
          <p className="text-gray-600 mt-1">Total: {responses.length} submissions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Emp ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Skills</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ratings</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Additional Skills</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => {
                const responseId = (response as any).id;
                return (
                <tr key={responseId} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingId === responseId ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          value={editData.employeeId || ''}
                          onChange={(e) => setEditData({ ...editData, employeeId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {editData.selectedSkills?.map((skill, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {editData.skillRatings?.map((sr, i) => (
                            <div key={i} className="text-xs">
                              {sr.skill}: <span className="font-semibold">{sr.rating}★</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={editData.additionalSkills || ''}
                          onChange={(e) => setEditData({ ...editData, additionalSkills: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(responseId)}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{response.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{response.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{response.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {response.selectedSkills.map((skill, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {response.skillRatings.map((sr, i) => (
                            <div key={i} className="text-xs">
                              {sr.skill}: <span className="font-semibold">{sr.rating}★</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                        <div className="line-clamp-2">{response.additionalSkills || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(response)}
                            className="p-2 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Edit2 size={18} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(responseId)}
                            className="p-2 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Response?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this response? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={deleting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
