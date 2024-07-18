const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');

const app = express();
const port = 3000;

// 解析表單提交的資料
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 設定靜態文件目錄
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'mySecret',
  name: 'user',
  resave: true,
  saveUninitialized: false, 
}))

// 建立 MySQL 連線
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'test_user'
});

// 連線到 MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// app.get('/', (req, res) => {
//   console.log(req.session)
//   console.log(req.sessionID) 
// })

// 路由設置
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'fake_fb.html'));
});
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM user', (error, results, fields) => {
    if (error) {
      console.error('Error querying MySQL:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ users: results });
    }
  });
});
// 受保護的頁面
app.get('/show_information', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'views', 'show_information.html'));
  } else {
    res.redirect('/');
  }
});
// 註冊用戶
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // 檢查是否已經有相同的 email 被註冊
  const checkSql = 'SELECT * FROM users WHERE email = ?';
  connection.query(checkSql, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error querying MySQL:', checkErr);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } else if (checkResults.length > 0) {
      res.json({ success: false, message: 'This account has already been registered' });
    } else {
      // 如果沒有相同的 email，插入新用戶資料
      const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
      const values = [email, password];

      connection.query(sql, values, (err, result) => {
        if (err) {
          console.error('Error inserting data into MySQL:', err);
          res.status(500).json({ success: false, message: 'Internal Server Error' });
        } else {
          res.json({ success: true, message: 'User registered successfully' });
        }
      });
    }
  });
});

// 處理表單提交
app.post('/fb_login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'INSERT INTO user (email, password) VALUES (?, ?)';
  const values = [email, password];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Data inserted into MySQL');
      res.send('Data inserted into MySQL');
    }
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  const values = [email, password];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } else if (results.length > 0) {
      req.session.loggedIn = true;
      res.json({ success: true, message: 'Login successful' }); // 返回 JSON 響應
      // res.redirect('/show_information'); // 重定向到受保護頁面
    } else {
      res.status(401).json({ success: false, message: 'Account or password incorrect' });
    }
  });
});


// 退出登錄
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } else {
      console.log('Session destroyed successfully'); 
      res.redirect('/');
    }
  });
});


// 監聽端口
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

