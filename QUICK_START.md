# Quick Start Guide

## What Changed?
Your application now connects to Azure MySQL instead of Supabase.

## Before You Start
You need your Azure MySQL connection details:
1. Server hostname (e.g., `myserver.mysql.database.azure.com`)
2. Admin username
3. Admin password
4. Database name (we're using `employee_skills_db`)

## Setup in 3 Steps

### Step 1: Configure Database Connection
Open `.env` file and update these lines with your Azure MySQL credentials:

```env
VITE_MYSQL_HOST=your-mysql-server.mysql.database.azure.com
VITE_MYSQL_USER=your-admin-username
VITE_MYSQL_PASSWORD=your-password
VITE_MYSQL_DATABASE=employee_skills_db
VITE_MYSQL_PORT=3306
```

### Step 2: Start the Backend Server
Open a terminal and run:
```bash
npm run server
```

You should see:
```
Backend API server running on http://localhost:3001
Database tables initialized successfully
```

### Step 3: Start the Frontend (in a new terminal)
```bash
npm run dev
```

## That's It!
Your application is now running with Azure MySQL.

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Testing the Connection
1. Go to http://localhost:5173
2. Fill out and submit the employee form
3. Check the Developer Dashboard (login: technical_user@ielektron.com / asdfasdf)
4. Your data should appear in the responses table

## Troubleshooting
If you get connection errors:
- Verify your Azure MySQL server is running
- Check that your IP is allowed in Azure MySQL firewall rules
- Confirm your credentials are correct in `.env`
- Make sure port 3001 is not in use

## Files Changed
- ✅ `server.js` - New Express backend server
- ✅ `src/lib/api.ts` - API client for backend
- ✅ `src/lib/mysql.ts` - MySQL connection utility
- ✅ All components updated to use new API
- ✅ `.env` - Added MySQL configuration

## Need Help?
See `AZURE_MYSQL_SETUP.md` for detailed documentation.
