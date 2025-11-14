import express from 'express';
import cors from 'cors';
import mongodb from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Fix: Use default import for MongoDB
const { MongoClient, ObjectId } = mongodb;

const app = express();
const port = process.env.PORT || 3001;

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files from React build (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Connection - Simplified for Azure
const connectionString = process.env.VITE_MONGODB_URI;
let db;
let client;

const initializeDatabase = async () => {
  try {
    console.log('🔍 Initializing database connection...');
    
    if (!connectionString) {
      console.error('❌ MongoDB connection string is missing');
      return false;
    }

    console.log('📊 Connection string present, attempting connection...');

    // Simple connection without complex options
    client = new MongoClient(connectionString);
    
    await client.connect();
    console.log('✅ MongoDB client connected');
    
    db = client.db(process.env.VITE_MONGODB_DATABASE || 'employee_skills');
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ Connected to MongoDB/Cosmos DB successfully');
    
    // Create indexes for better performance
    await db.collection('employee_responses').createIndex({ email: 1 });
    await db.collection('employee_responses').createIndex({ employee_id: 1 });
    await db.collection('employee_responses').createIndex({ timestamp: -1 });
    
    console.log('✅ Database indexes initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('🔍 Full error:', error);
    return false;
  }
};

// Database connection middleware
const requireDB = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ 
      error: 'Database not connected',
      message: 'Please check the database connection and try again'
    });
  }
  next();
};

// ========== API ROUTES ==========

// Root route - serve API info
app.get('/', (req, res) => {
  res.json({
    message: 'Employee Skills API Server is running!',
    endpoints: {
      health: '/api/health',
      responses: {
        create: 'POST /api/responses',
        list: 'GET /api/responses'
      },
      schemas: {
        get: 'GET /api/schemas',
        create: 'POST /api/schemas'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  if (!db) {
    return res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected'
    });
  }
  
  try {
    await db.command({ ping: 1 });
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'error', 
      error: error.message
    });
  }
});

// Your existing API routes (keep all of these)
app.get('/api/responses', requireDB, async (req, res) => {
  try {
    const responses = await db.collection('employee_responses')
      .find()
      .sort({ timestamp: -1 })
      .toArray();
    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

app.post('/api/responses', requireDB, async (req, res) => {
  console.log('📝 POST /api/responses received');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Database status:', db ? 'Connected' : 'Disconnected');

  try {
    // Test database connection first
    console.log('🔍 Testing database connection with ping...');
    try {
      await db.command({ ping: 1 });
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.error('❌ Database ping failed:', pingError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: pingError.message
      });
    }

    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    console.log('🔍 Parsed fields:', {
      name, 
      employeeId, 
      email, 
      selectedSkillsCount: selectedSkills?.length,
      skillRatingsCount: skillRatings?.length,
      additionalSkills
    });

    // Validate required fields
    if (!name) {
      console.log('❌ Missing name');
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (!employeeId) {
      console.log('❌ Missing employeeId');
      return res.status(400).json({ error: 'Missing required field: employeeId' });
    }
    if (!email) {
      console.log('❌ Missing email');
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    console.log('✅ All required fields present');

    // Check for existing response
    console.log('🔍 Checking for existing response...');
    try {
      const existingResponse = await db.collection('employee_responses').findOne({
        $or: [
          { employee_id: employeeId },
          { email: email }
        ]
      });

      if (existingResponse) {
        console.log('❌ Duplicate found:', existingResponse._id);
        return res.status(409).json({ 
          error: 'Employee response already exists',
          details: 'An assessment for this employee ID or email already exists'
        });
      }
      console.log('✅ No duplicate found');
    } catch (findError) {
      console.error('❌ Error checking for duplicates:', findError);
      throw new Error(`Duplicate check failed: ${findError.message}`);
    }

    const response = {
      name,
      employee_id: employeeId,
      email,
      selected_skills: selectedSkills || [],
      skill_ratings: skillRatings || [],
      additional_skills: additionalSkills || '',
      timestamp: new Date()
    };

    console.log('💾 Prepared document for insertion:', JSON.stringify(response, null, 2));

    console.log('💾 Attempting to insert into database...');
    let result;
    try {
      result = await db.collection('employee_responses').insertOne(response);
      console.log('✅ Response saved with ID:', result.insertedId);
    } catch (insertError) {
      console.error('❌ Database insertion failed:', insertError);
      console.error('🔍 Insert error details:', {
        code: insertError.code,
        codeName: insertError.codeName,
        writeErrors: insertError.writeErrors
      });
      throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    res.json({ 
      id: result.insertedId, 
      message: 'Response created successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/responses:', error);
    console.error('🔍 Full error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      stack: error.stack
    });
    
    // Send detailed error information
    res.status(500).json({ 
      error: 'Failed to create response',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Keep all your other existing API routes...
app.put('/api/responses/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await db.collection('employee_responses').updateOne(
      { _id: objectId },
      {
        $set: {
          name,
          employee_id: employeeId,
          email,
          selected_skills: selectedSkills,
          skill_ratings: skillRatings,
          additional_skills: additionalSkills
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

app.delete('/api/responses/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await db.collection('employee_responses').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

app.get('/api/schemas', requireDB, async (req, res) => {
  try {
    const schema = await db.collection('form_schemas')
      .find()
      .sort({ version: -1 })
      .limit(1)
      .toArray();
    res.json(schema[0] || null);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
});

app.put('/api/schemas/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { schema } = req.body;

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await db.collection('form_schemas').updateOne(
      { _id: objectId },
      {
        $set: {
          schema,
          version: Date.now(),
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Schema not found' });
    }

    res.json({ message: 'Schema updated successfully' });
  } catch (error) {
    console.error('Error updating schema:', error);
    res.status(500).json({ error: 'Failed to update schema' });
  }
});

// ========== CATCH-ALL ROUTE FOR REACT APP ==========
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// ========== SERVER STARTUP ==========
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    
    // Initialize database but don't block server startup
    initializeDatabase().then(connected => {
      if (connected) {
        console.log('✅ Database connection established');
      } else {
        console.log('⚠️  Database connection failed - API will return errors');
      }
    });

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Full-stack server running on port ${port}`);
      console.log(`📁 Serving React app from: ${path.join(__dirname, 'dist')}`);
      console.log(`🔗 API available at: http://localhost:${port}/api`);
      console.log(`🌐 Frontend available at: http://localhost:${port}`);
      console.log(`💾 Database status: ${db ? 'Connected' : 'Connecting...'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();