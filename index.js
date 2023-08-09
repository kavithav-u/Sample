const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const User = require('./models/User');
const Book = require('./models/Book');



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');


let loggedIn = false;
mongoose.connect('mongodb://127.0.0.1:27017/website', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB new');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// const userSchema = new mongoose.Schema({
//     username: String,
//     password: String,
//     isAdmin: Boolean,
//     email:String,
//   });

//   const User = mongoose.model('User', userSchema);

app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: false
}));

const requireLogin = (req, res, next) => {
  if (req.path !== '/login' && !req.session.loggedIn) {
    res.redirect('/login');
  } else {
    next();
  }
};

app.use((req, res, next) => {

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});



app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (username === 'admin' && password === 'admin') {
      req.session.loggedIn = true;
      req.session.isAdmin = true;
      return res.redirect('/admin/dashboard');
    }

    const user = await User.findOne({ username });

    if (!user) {
      //if not User 
      return res.redirect('/login');
    }

    if (password === user.password) {
      req.session.loggedIn = true;
      req.session.isAdmin = false;
      req.session.userId = user._id;
      req.session.email = user.email;
      return res.redirect('/user/dashboard');
    } else {
      // Incorrect password
      return res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});





app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;


  try {
    // Create a new user using your User model
    const user = new User({
      email,
      username,
      password,
      isAdmin: false,
    });

    await user.save();

    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.redirect('/register');
  }
});

// const bookSchema = new mongoose.Schema({
//   name: String,
//   author: String,
//   publishedYear: Number,
//   storyline: String,
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
// });

// const Book = mongoose.model('Book', bookSchema);

// ...

app.get('/user/dashboard', async (req, res) => {
  try {
    const books = await Book.find({ userId: req.session.userId });
    res.render('userDashboard', { bookCollection: books });
  } catch (error) {
    console.error(error);
    res.redirect('/login');
  }
});

app.post('/user/dashboard/book', async (req, res) => {
  // Extract the book details from the request body
  const { bookName, author, publishedYear, storyline } = req.body;

  try {

    const book = new Book({
      name: bookName,
      author,
      publishedYear,
      storyline,
      userId: req.session.userId,
    });


    await book.save();

    res.redirect('/user/dashboard');
  } catch (error) {
    console.error(error);
    res.redirect('/user/dashboard');
  }
});



app.post('/user/dashboard', async (req, res) => {
  const { name, author, publishedYear, storyline } = req.body;

  try {
    const book = new Book({
      name,
      author,
      publishedYear,
      storyline,
      userId: req.session.userId,
    });

    await book.save();

    res.redirect('/user/dashboard#success');
  } catch (error) {
    console.error(error);
    res.redirect('/user/dashboard');
  }
});

app.get('/user/dashboard/edit/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    const book = await Book.findById(bookId);

    if (!book) {

      return res.redirect('/user/dashboard');
    }

    res.render('editBook', { book });
  } catch (error) {
    console.error(error);
    res.redirect('/user/dashboard');
  }
});

app.post('/user/dashboard/edit/:id', async (req, res) => {
  const bookId = req.params.id;
  const { bookName, author, publishedYear, storyline } = req.body;

  try {
    await Book.updateOne({ _id: bookId, userId: req.session.userId }, { name: bookName, author, publishedYear, storyline });
    res.redirect('/user/dashboard');
  } catch (error) {
    console.error(error);
    res.redirect('/user/dashboard');
  }
});

app.post('/user/dashboard/delete/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    await Book.deleteOne({ _id: bookId, userId: req.session.userId });
    res.redirect('/user/dashboard');
  } catch (error) {
    console.error(error);
    res.redirect('/user/dashboard');
  }
});

// ...

app.get('/admin/dashboard', async (req, res) => {
  if (req.session.isAdmin) {
    try {
      const users = await User.find({});
      res.render('adminDashboard', { users });
    } catch (error) {
      console.error(error);
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});

// Admin view user's book collection
app.get('/admin/user/bookCollection/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    const books = await Book.find({ userId });

    res.render('adminViewBooks', { user, bookCollection: books });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/dashboard');
  }
});

// Admin edit user credentials
app.get('/admin/user/edit/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    res.render('adminEditUser', { user });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/user/edit/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { username, email } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { username, email });
    res.render('adminEditUser', { user: { _id: userId, username, email }, success: true });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/user/edit/' + userId + '?success=true');
  }
});

// Admin delete user
app.get('/admin/user/delete/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndDelete(userId);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.redirect('/admin/dashboard');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});


const port = 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



