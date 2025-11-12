import express from 'express';
import cors from 'cors';
import mongodb from 'mongodb';
const { MongoClient, ObjectId } = mongodb;
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// MongoDB/Cosmos DB connection
const connectionString = process.env.VITE_MONGODB_URI;
const client = new MongoClient(connectionString);
let db;

// In your server.js, update the initializeDatabase function
const initializeDatabase = async () => {
  try {
    await client.connect();
    db = client.db(process.env.VITE_MONGODB_DATABASE || 'employee_skills');
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ Connected to MongoDB/Cosmos DB successfully');
    
    // Create indexes for better performance
    await db.collection('employee_responses').createIndex({ email: 1 });
    await db.collection('employee_responses').createIndex({ employee_id: 1 });
    await db.collection('employee_responses').createIndex({ timestamp: -1 });
    
    console.log('✅ Database indexes initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('🔍 Connection string:', connectionString ? 'Present' : 'Missing');
  }
};

// In server.js
const connectWithRetry = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      await client.connect();
      db = client.db(process.env.VITE_MONGODB_DATABASE || 'employee_skills');
      console.log('Connected to MongoDB/Cosmos DB successfully');
      return;
    } catch (error) {
      console.error(`Connection failed. Retries left: ${retries - 1}`, error);
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to database after retries');
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

// Routes
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
// Add this route to your server.js - place it before your other routes
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

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Your existing health endpoint (keep this)
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


// ✅ FIXED: Only ONE POST /api/responses route
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

app.listen(port, async () => {
  await initializeDatabase();
  console.log(`Backend API server running on http://localhost:${port}`);
});

app.get('/api/debug/db-status', requireDB, async (req, res) => {
  try {
    const pingResult = await db.command({ ping: 1 });
    const collections = await db.listCollections().toArray();
    
    res.json({
      status: 'connected',
      ping: pingResult,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Test collection operations
app.get('/api/debug/collection-test', requireDB, async (req, res) => {
  try {
    const testDoc = {
      test: 'diagnostic',
      timestamp: new Date(),
      random: Math.random()
    };
    
    // Test insert
    const insertResult = await db.collection('employee_responses').insertOne(testDoc);
    console.log('✅ Diagnostic insert successful:', insertResult.insertedId);
    
    // Test find
    const foundDoc = await db.collection('employee_responses').findOne({_id: insertResult.insertedId});
    console.log('✅ Diagnostic find successful:', foundDoc ? 'found' : 'not found');
    
    // Test delete
    const deleteResult = await db.collection('employee_responses').deleteOne({_id: insertResult.insertedId});
    console.log('✅ Diagnostic delete successful:', deleteResult.deletedCount);
    
    res.json({
      status: 'all operations successful',
      insert: insertResult.insertedId ? 'success' : 'failed',
      find: foundDoc ? 'success' : 'failed', 
      delete: deleteResult.deletedCount > 0 ? 'success' : 'failed',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    res.status(500).json({
      status: 'diagnostic failed',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Check if collection exists and has documents
app.get('/api/debug/collection-info', requireDB, async (req, res) => {
  try {
    const collection = db.collection('employee_responses');
    const count = await collection.countDocuments();
    const indexes = await collection.indexes();
    
    res.json({
      collection: 'employee_responses',
      documentCount: count,
      indexes: indexes,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date()
    });
  }
});