const API_BASE_URL = 'http://localhost:3001/api';

interface EmployeeResponse {
  _id?: string;
  name: string;
  employee_id: string;
  email: string;
  selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number }>;
  additional_skills: string;
  timestamp?: string;
}

interface FormSchema {
  _id?: string;
  schema: any;
  version?: number;
}

export const api = {
  async getResponses(): Promise<EmployeeResponse[]> {
    const response = await fetch(`${API_BASE_URL}/responses`);
    if (!response.ok) throw new Error('Failed to fetch responses');
    return response.json();
  },

  async createResponse(data: Omit<EmployeeResponse, '_id' | 'timestamp'>): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        employeeId: data.employee_id,
        email: data.email,
        selectedSkills: data.selected_skills,
        skillRatings: data.skill_ratings,
        additionalSkills: data.additional_skills
      })
    });
    if (!response.ok) throw new Error('Failed to create response');
    return response.json();
  },

  async updateResponse(id: number, data: Partial<EmployeeResponse>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/responses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        employeeId: data.employee_id,
        email: data.email,
        selectedSkills: data.selected_skills,
        skillRatings: data.skill_ratings,
        additionalSkills: data.additional_skills
      })
    });
    if (!response.ok) throw new Error('Failed to update response');
  },

  async deleteResponse(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/responses/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete response');
  },

  async getSchema(): Promise<FormSchema | null> {
    const response = await fetch(`${API_BASE_URL}/schemas`);
    if (!response.ok) throw new Error('Failed to fetch schema');
    return response.json();
  },

  async createSchema(schema: any): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema })
    });
    if (!response.ok) throw new Error('Failed to create schema');
    return response.json();
  },

  async updateSchema(id: number, schema: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/schemas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema })
    });
    if (!response.ok) throw new Error('Failed to update schema');
  }
};