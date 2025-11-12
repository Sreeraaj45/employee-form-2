import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X, ChevronUp, ChevronDown, Loader } from 'lucide-react';
import { api } from '../lib/api';

interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'single-select' | 'multi-select';
  options?: string[];
  required?: boolean;
}

const DEFAULT_FIELDS: Field[] = [
  { id: '1', label: 'Name', type: 'text', required: true },
  { id: '2', label: 'Employee ID', type: 'text', required: true },
  { id: '3', label: 'Email ID', type: 'text', required: true },
  { id: '4', label: 'Skills', type: 'multi-select', options: ['Python', 'Development', 'Data Analysis', 'AI/ML Engineer (GCP, AWS)', 'Full Stack Developer', 'DevOps', 'System/Software Requirement Engineer'], required: true },
  { id: '5', label: 'Additional Skills', type: 'text', required: false }
];

export default function FormBuilder() {
  const [fields, setFields] = useState<Field[]>(DEFAULT_FIELDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [addingOptions, setAddingOptions] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'single-select' | 'multi-select'>('text');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaId, setSchemaId] = useState<string | null>(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const data = await api.getSchema();
      if (data) {
        setSchemaId(data._id || null);
        if (data.schema && Array.isArray(data.schema)) {
          setFields(data.schema);
        }
      }
    } catch (err) {
      console.error('Error loading schema:', err);
      setFields(DEFAULT_FIELDS);
    } finally {
      setLoading(false);
    }
  };

  const saveSchema = async (updatedFields: Field[]) => {
    setSaving(true);
    try {
      if (schemaId) {
        await api.updateSchema(parseInt(schemaId), updatedFields);
      } else {
        const data = await api.createSchema(updatedFields);
        if (data) {
          setSchemaId(data.id);
        }
      }
      setFields(updatedFields);
    } catch (err) {
      console.error('Error saving schema:', err);
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const newField: Field = {
      id: Date.now().toString(),
      label: `New ${newFieldType} field`,
      type: newFieldType,
      options: ['single-select', 'multi-select'].includes(newFieldType) ? ['Option 1'] : undefined,
      required: false
    };
    saveSchema([...fields, newField]);
  };

  const deleteField = (id: string) => {
    saveSchema(fields.filter(f => f.id !== id));
  };

  const updateFieldLabel = (id: string, newLabel: string) => {
    const updated = fields.map(f => f.id === id ? { ...f, label: newLabel } : f);
    saveSchema(updated);
    setEditingId(null);
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) return;

    const newFields = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    saveSchema(newFields);
  };

  const addOption = (fieldId: string, option: string) => {
    const updated = fields.map(f =>
      f.id === fieldId && f.options
        ? { ...f, options: [...f.options, option] }
        : f
    );
    saveSchema(updated);
    setNewOption('');
    setAddingOptions(null);
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const updated = fields.map(f =>
      f.id === fieldId && f.options
        ? { ...f, options: f.options.filter((_, i) => i !== optionIndex) }
        : f
    );
    saveSchema(updated);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Form Builder</h2>
          <p className="text-gray-600 mt-1">Customize your employee form</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center gap-3">
          <Loader size={24} className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading form schema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Form Builder</h2>
          <p className="text-gray-600 mt-1">Customize your employee form</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader size={20} className="animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6 flex gap-2">
          <select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="single-select">Single Select</option>
            <option value="multi-select">Multi Select</option>
          </select>
          <button
            onClick={addField}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => moveField(field.id, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => moveField(field.id, 'down')}
                    disabled={index === fields.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                <div className="flex-1">
                  {editingId === field.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => updateFieldLabel(field.id, editLabel)}
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
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{field.label}</div>
                        <div className="text-sm text-gray-500">Type: {field.type}</div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(field.id);
                          setEditLabel(field.label);
                        }}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Edit2 size={18} className="text-blue-600" />
                      </button>
                      {['single-select', 'multi-select'].includes(field.type) && (
                        <div className="flex flex-wrap gap-2">
                          {field.options?.map((opt, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                              {opt}
                              <button
                                onClick={() => removeOption(field.id, i)}
                                className="hover:text-red-600 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                          {addingOptions === field.id ? (
                            <div className="flex gap-1">
                              <input
                                autoFocus
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addOption(field.id, newOption)}
                                placeholder="Add option"
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => addOption(field.id, newOption)}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Add
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingOptions(field.id)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 flex items-center gap-1"
                            >
                              <Plus size={14} />
                              Option
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => deleteField(field.id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Changes are automatically saved to the database. The form schema is persistent across page reloads and devices.
        </p>
      </div>
    </div>
  );
}