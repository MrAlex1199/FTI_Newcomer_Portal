import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
// Registers every Mongoose model exactly once, on process start, regardless
// of which controller happens to import which model first. Without this,
// `populate('someRef')` can throw MissingSchemaError if the referenced
// model's file was never imported by anything on the current request path.
import './models/index.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ════════════════════════════════════════════════════════');
  console.log(`   FTI Welcome Hub Server is running`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log('🚀 ════════════════════════════════════════════════════════');
  console.log('');
});
