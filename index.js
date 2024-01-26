const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const argon2 = require('argon2');
const { connectDB, User } = require('./User'); // Adjust the path as needed

const app = express();
const port = 3000;

connectDB();
app.use(cors());
app.use(bodyParser.json());

const authenticateUser = async (req, res, next) => {
  try {
    const tokenHeader = req.header('Authorization');

    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = tokenHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 's3cr3t');

    req.user = {
      _id: decoded._id,
    };

    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(401).json({ message: 'Authentication failed' });
    }
  }
};

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await argon2.hash(password);

    const newUser = new User({
      username,
      password: hashedPassword,
      todos: [],
    });

    await newUser.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await argon2.verify(user.password, password))) {
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 's3cr3t', {
        expiresIn: '1h',
      });

      res.json({ token });
    } else {
      res.status(401).json({ message: 'Login failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.post('/addtodo', authenticateUser, async (req, res) => {
  try {
    const { task, completed } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { todos: { task, completed } } },
      { new: true }
    );

    res.status(200).json({ todos: updatedUser.todos });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/removetodo', authenticateUser, async (req, res) => {
  try {
    const { todoId } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { todos: { _id: todoId } } },
      { new: true }
    );

    res.status(200).json({ todos: updatedUser.todos });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tasks = user.todos;
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error finding tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/updatetodo/:index', authenticateUser, async (req, res) => {
  try {
    const { index } = req.params;
    const { completed } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { [`todos.${index}.completed`]: completed } },
      { new: true }
    );

    res.status(200).json({ todos: updatedUser.todos });
  } catch (error) {
    console.error('Error updating task status:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post("/del", async (req, res) => {
  // const result=await User.deleteMany();
  res.send("Deleted successfully");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
