import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
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

const initializeDatabase = async () => {
  try {
    await client.connect();
    db = client.db(process.env.VITE_MONGODB_DATABASE || 'employee_skills');
    console.log('Connected to MongoDB/Cosmos DB successfully');
    
    // Create indexes for better performance
    await db.collection('employee_responses').createIndex({ email: 1 });
    await db.collection('employee_responses').createIndex({ employee_id: 1 });
    await db.collection('employee_responses').createIndex({ timestamp: -1 });
    await db.collection('form_schemas').createIndex({ version: -1 });
    
    console.log('Database indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Routes
app.get('/api/responses', async (req, res) => {
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

app.post('/api/responses', async (req, res) => {
  try {
    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    const response = {
      name,
      employee_id: employeeId,
      email,
      selected_skills: selectedSkills,
      skill_ratings: skillRatings,
      additional_skills: additionalSkills,
      timestamp: new Date()
    };

    const result = await db.collection('employee_responses').insertOne(response);
    res.json({ id: result.insertedId, message: 'Response created successfully' });
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

app.post('/api/responses', requireDB, async (req, res) => {
  console.log('📝 POST /api/responses received');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Headers:', req.headers);

  try {
    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    // Validate required fields with detailed errors
    if (!name) {
      console.log('❌ Missing name');
      return res.status(400).json({ 
        error: 'Missing required field: name' 
      });
    }
    if (!employeeId) {
      console.log('❌ Missing employeeId');
      return res.status(400).json({ 
        error: 'Missing required field: employeeId' 
      });
    }
    if (!email) {
      console.log('❌ Missing email');
      return res.status(400).json({ 
        error: 'Missing required field: email' 
      });
    }

    console.log('✅ All required fields present');

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

    // Test if collection exists and is accessible
    const collection = db.collection('employee_responses');
    console.log('📋 Collection access verified');

    const result = await collection.insertOne(response);
    console.log('✅ Response saved with ID:', result.insertedId);

    res.json({ 
      id: result.insertedId, 
      message: 'Response created successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/responses:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to create response',
      details: error.message,
      code: error.code
    });
  }
});

app.put('/api/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    const result = await db.collection('employee_responses').updateOne(
      { _id: new ObjectId(id) },
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

app.delete('/api/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('employee_responses').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

app.get('/api/schemas', async (req, res) => {
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

app.post('/api/schemas', async (req, res) => {
  try {
    const { schema } = req.body;
    const formSchema = {
      schema,
      version: Date.now(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('form_schemas').insertOne(formSchema);
    res.json({ id: result.insertedId, message: 'Schema created successfully' });
  } catch (error) {
    console.error('Error creating schema:', error);
    res.status(500).json({ error: 'Failed to create schema' });
  }
});

app.put('/api/schemas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { schema } = req.body;

    const result = await db.collection('form_schemas').updateOne(
      { _id: new ObjectId(id) },
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

app.listen(port, async () => {
  await initializeDatabase();
  console.log(`Backend API server running on http://localhost:${port}`);
});