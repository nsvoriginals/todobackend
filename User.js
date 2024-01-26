// db.js
const mongoose = require('mongoose');

 async function connectDB(){
  try {
    await mongoose.connect('mongodb+srv://nsviam:td6gILBDtRNWylPH@cluster0.ft1cxom.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add other options as needed
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit the process with an error code
  }
};

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  todos: [
    {
      task: {
        type: String,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

const User = mongoose.model('User', UserSchema);

module.exports = { connectDB, User };
