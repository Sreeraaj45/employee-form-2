# Azure MySQL Setup Guide

## Overview
Your application has been migrated from Supabase to Azure MySQL Flexible Server. The backend now uses a Node.js Express server that connects to your Azure MySQL database.

## Architecture
- **Frontend**: React + Vite (running on port 5173)
- **Backend API**: Express server (running on port 3001)
- **Database**: Azure MySQL Flexible Server

## Prerequisites
1. Azure MySQL Flexible Server instance created
2. Database credentials (host, username, password)
3. Node.js installed

## Configuration Steps

### 1. Update Environment Variables
Edit the `.env` file in the project root and update these values with your Azure MySQL credentials:

```env
VITE_MYSQL_HOST=your-mysql-server.mysql.database.azure.com
VITE_MYSQL_USER=your-admin-username
VITE_MYSQL_PASSWORD=your-password
VITE_MYSQL_DATABASE=employee_skills_db
VITE_MYSQL_PORT=3306
```

**Important**: Replace the placeholder values with your actual Azure MySQL credentials:
- `your-mysql-server.mysql.database.azure.com` → Your Azure MySQL server name
- `your-admin-username` → Your MySQL admin username
- `your-password` → Your MySQL admin password

### 2. Azure MySQL Configuration
Ensure your Azure MySQL Flexible Server has:
- SSL/TLS enabled (required for secure connections)
- Firewall rules configured to allow connections from your IP address
- Database `employee_skills_db` created (or it will be auto-created)

### 3. Install Dependencies
All required packages are already installed, but if needed:
```bash
npm install
```

### 4. Run the Application

#### Option 1: Run Backend and Frontend Together
```bash
npm run dev:all
```

#### Option 2: Run Backend and Frontend Separately
In terminal 1 (Backend):
```bash
npm run server
```

In terminal 2 (Frontend):
```bash
npm run dev
```

## Database Schema
The backend automatically creates the following tables on startup:

### employee_responses
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR)
- `employee_id` (VARCHAR)
- `email` (VARCHAR)
- `selected_skills` (JSON)
- `skill_ratings` (JSON)
- `additional_skills` (TEXT)
- `timestamp` (DATETIME)

### form_schemas
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `schema` (JSON)
- `version` (BIGINT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## API Endpoints

### Employee Responses
- `GET /api/responses` - Fetch all employee responses
- `POST /api/responses` - Create a new response
- `PUT /api/responses/:id` - Update a response
- `DELETE /api/responses/:id` - Delete a response

### Form Schemas
- `GET /api/schemas` - Fetch the current form schema
- `POST /api/schemas` - Create a new schema
- `PUT /api/schemas/:id` - Update the schema

## Troubleshooting

### Connection Errors
If you see "ECONNREFUSED" or similar errors:
1. Verify your Azure MySQL server is running
2. Check firewall rules allow your IP address
3. Verify credentials in `.env` file
4. Ensure SSL/TLS is properly configured

### SSL Certificate Errors
Azure MySQL requires SSL. The connection is configured with:
```javascript
ssl: {
  rejectUnauthorized: true
}
```

If you face SSL issues, you may need to download Azure's SSL certificate and reference it.

### Database Not Found
The database `employee_skills_db` must exist. Create it manually:
```sql
CREATE DATABASE employee_skills_db;
```

## Migration from Supabase
All Supabase client calls have been replaced with the new API layer:
- `src/lib/api.ts` - New API client
- `server.js` - Express backend server
- All components updated to use the new API

## Testing
1. Start both servers
2. Navigate to `http://localhost:5173`
3. Fill out the employee form and submit
4. Check the Developer Dashboard to see responses
5. Verify data is being saved to Azure MySQL

## Production Deployment
For production:
1. Update CORS settings in `server.js` to restrict origins
2. Use environment variables for all sensitive data
3. Deploy backend to Azure App Service or similar
4. Deploy frontend to static hosting
5. Update API_BASE_URL in `src/lib/api.ts` to point to production backend

## Support
If you encounter issues, check:
- Backend server logs in the terminal
- Browser console for frontend errors
- Azure MySQL query logs
- Network tab for API request/response details
