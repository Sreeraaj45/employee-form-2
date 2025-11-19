// Auto-detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api';  // Relative path for production

console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🔗 API Base URL:', API_BASE_URL);

interface EmployeeResponse {
  _id?: string;  // Changed from id?: number to _id?: string for MongoDB
  name: string;
  employee_id: string;
  email: string;
  selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number }>;
  additional_skills: string;
  timestamp?: string;
  // Manager review fields
  manager_ratings?: Array<{ skill: string; rating: number }>;
  company_expectations?: Array<{ skill: string; expectation: number }>;
  rating_gaps?: Array<{ skill: string; gap: number }>;
  overall_manager_review?: string;
  manager_review_timestamp?: string;
}

interface FormSchema {
  _id?: string;  // Changed from id?: number to _id?: string for MongoDB
  schema: any;
  version?: number;
}

export const api = {
  // Add this missing method
  async getResponses(): Promise<EmployeeResponse[]> {
    console.log('🔄 Fetching responses from API...');
    const response = await fetch(`${API_BASE_URL}/responses`);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch responses:', errorText);
      throw new Error(`Failed to fetch responses: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Responses fetched successfully, count:', data.length);
    return data;
  },

  async createResponse(data: Omit<EmployeeResponse, '_id' | 'timestamp'>): Promise<{ id: string }> {
    console.log('📤 Creating response with data:', data);
    
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
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      // Get detailed error message from response body
      let errorMessage = `Failed to create response: ${response.status}`;
      let errorDetails = '';
      
      // Read the response body as text first, then try to parse as JSON
      try {
        const responseText = await response.text();
        console.error('🔍 Backend error response:', responseText);
        
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorDetails = errorData.details || errorData.code || '';
        } catch (jsonError) {
          // If not JSON, use the text directly
          errorMessage = responseText || errorMessage;
        }
      } catch (textError) {
        console.error('🔍 Could not read error response body');
      }
      
      const fullError = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage;
      console.error('❌ API Error:', fullError);
      throw new Error(fullError);
    }
    
    const result = await response.json();
    console.log('✅ API Success:', result);
    return result;
  },

  async updateResponse(id: string, data: Partial<EmployeeResponse>): Promise<void> {
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

  async deleteResponse(id: string): Promise<void> {
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

  async updateSchema(id: string, schema: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/schemas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema })
    });
    if (!response.ok) throw new Error('Failed to update schema');
  },

  async saveManagerReview(
    id: string,
    data: {
      managerRatings: Array<{ skill: string; rating: number }>;
      companyExpectations: Array<{ skill: string; expectation: number }>;
      ratingGaps: Array<{ skill: string; gap: number }>;
      overallManagerReview: string;
    }
  ): Promise<void> {
    console.log('📤 Saving manager review for response:', id);
    console.log('📊 Manager review data:', data);
    
    const response = await fetch(`${API_BASE_URL}/responses/${id}/manager-review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      // Get detailed error message from response body
      let errorMessage = `Failed to save manager review: ${response.status}`;
      let errorDetails = '';
      
      // Read the response body as text first, then try to parse as JSON
      try {
        const responseText = await response.text();
        console.error('🔍 Backend error response:', responseText);
        
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorDetails = errorData.details || '';
        } catch (jsonError) {
          // If not JSON, use the text directly
          errorMessage = responseText || errorMessage;
        }
      } catch (textError) {
        console.error('🔍 Could not read error response body');
      }
      
      const fullError = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage;
      console.error('❌ API Error:', fullError);
      throw new Error(fullError);
    }
    
    const result = await response.json();
    console.log('✅ Manager review saved successfully:', result);
  }
};