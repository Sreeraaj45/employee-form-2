import { useState, useEffect } from 'react';
import { Trash2, Edit2, Save, X, Loader, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

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
      console.log('🔄 Loading responses from API...');
      const data = await api.getResponses();
      console.log('📥 Received responses:', data);
      console.log('📊 Response count:', data.length);
      
      if (data && Array.isArray(data)) {
        setResponses(data);
        console.log('✅ Responses loaded successfully');
      } else {
        console.error('❌ Invalid response format:', data);
        setError('Invalid data format received from server');
      }
    } catch (err: any) {
      console.error('❌ Error loading responses:', err);
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
      setResponses(responses.filter(r => r._id !== id));
      setShowDeleteModal(null);
    } catch (err: any) {
      console.error('Error deleting response:', err);
      setError('Failed to delete response');
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await api.updateResponse(id, {
        name: editData.name,
        employee_id: editData.employee_id,
        email: editData.email,
        selected_skills: editData.selected_skills,
        skill_ratings: editData.skill_ratings,
        additional_skills: editData.additional_skills
      });

      const updated = responses.map(r =>
        r._id === id ? { ...editData, timestamp: r.timestamp, _id: id } as EmployeeResponse : r
      );
      setResponses(updated);
      setEditingId(null);
    } catch (err: any) {
      console.error('Error updating response:', err);
      setError('Failed to update response');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add this debug section to see what's happening
  console.log('🔍 Current responses state:', {
    loading,
    responsesCount: responses.length,
    responses: responses
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Responses</h2>
            <p className="text-gray-600 mt-1">Employee form responses</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center gap-3">
          <Loader size={24} className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading responses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Responses</h2>
            <p className="text-gray-600 mt-1">Employee form responses</p>
          </div>
          <button
            onClick={loadResponses}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Responses</h2>
            <p className="text-gray-600 mt-1">Employee form responses</p>
          </div>
          <button
            onClick={loadResponses}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No responses yet</p>
          <p className="text-gray-400 text-sm">
            Submit some forms through the employee portal to see responses here.
          </p>
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
        <button
          onClick={loadResponses}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Debug info - remove this in production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          <strong>Debug:</strong> Showing {responses.length} responses. Check browser console for details.
        </p>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => {
                const responseId = response._id!;
                const isEditing = editingId === responseId;
                
                return (
                  <tr key={responseId} className="border-b border-gray-200 hover:bg-gray-50">
                    {/* Name */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{response.name}</span>
                      )}
                    </td>

                    {/* Employee ID */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.employee_id || ''}
                          onChange={(e) => setEditData({ ...editData, employee_id: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="text-gray-700">{response.employee_id}</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="text-gray-700">{response.email}</span>
                      )}
                    </td>

                    {/* Skills */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {isEditing ? (
                          <textarea
                            value={editData.selected_skills?.join(', ') || ''}
                            onChange={(e) => setEditData({ 
                              ...editData, 
                              selected_skills: e.target.value.split(',').map(s => s.trim()) 
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            rows={3}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {response.selected_skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                            {response.selected_skills.length > 3 && (
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                +{response.selected_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ratings */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {isEditing ? (
                          <textarea
                            value={JSON.stringify(editData.skill_ratings || [], null, 2)}
                            onChange={(e) => {
                              try {
                                const ratings = JSON.parse(e.target.value);
                                setEditData({ ...editData, skill_ratings: ratings });
                              } catch (err) {
                                // Invalid JSON, keep as is
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                            rows={3}
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            {response.skill_ratings.length} skills rated
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Additional Skills */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <textarea
                          value={editData.additional_skills || ''}
                          onChange={(e) => setEditData({ ...editData, additional_skills: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      ) : (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {response.additional_skills || 'None'}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(response.timestamp)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(responseId)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-600 hover:text-gray-800"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(response)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(responseId)}
                              className="p-1 text-red-600 hover:text-red-800"
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

      {/* Delete modal */}
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