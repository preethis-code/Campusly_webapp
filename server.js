const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});



const app = express();
const PORT = 3000;

// allow JSON body
app.use(express.json());
app.use(cors());


// temporary knowledge base (we'll move this to DB later)
const KNOWLEDGE_BASE = {
    hi: "Hello! I'm your College Helpdesk Assistant. How can I help you today?",
    bye: "You're welcome! Feel free to reach out if you have more questions. Goodbye!",
    ok: "Great! Let me know if there's anything else you'd like to know.",
    thanks: "You're very welcome! I'm here to help.",
    admission: "Admissions are done through an online application process. Students need to fill the application form and submit required documents such as mark sheets and ID proof.",
    exam: "Exams are conducted at the end of each semester. Exam schedules and details are shared through official notices.",
    fees: "Fees can be paid online or at the college accounts office. The fee structure depends on the course selected.",
    timetable: "The class timetable is released at the beginning of each semester and may be updated if required.",
    contact: "Students can contact the college office through official email or phone during working hours.",
    status: "I'm doing great, thank you for asking! Ready to help you with college info.",
    capabilities: "I can help you with information about admissions, exams, fees, timetables, and contact details. Just ask!"
};

// CHAT API
app.post('/chat', (req, res) => {
    const { message, email } = req.body;
    const userMessage = (message || "").toLowerCase().trim();
    console.log(`[Chatbot] Received from ${email || 'guest'}: "${userMessage}"`);

    // Helper for improved matching
    const matches = (keyword) => new RegExp(`\\b${keyword}\\b`, 'i').test(userMessage);

    let reply = "";

    // 1. TOPIC-SPECIFIC RESPONSES (HIGHEST PRIORITY)
    if (userMessage.includes('admission')) reply = KNOWLEDGE_BASE.admission;
    else if (userMessage.includes('exam')) reply = KNOWLEDGE_BASE.exam;
    else if (userMessage.includes('fee')) reply = KNOWLEDGE_BASE.fees;
    else if (userMessage.includes('timetable') || userMessage.includes('schedule')) reply = KNOWLEDGE_BASE.timetable;
    else if (userMessage.includes('contact')) reply = KNOWLEDGE_BASE.contact;
    // 2. GREETINGS & GENERIC FILLERS
    else if (matches('hi') || matches('hello') || matches('hey') || matches('hii')) reply = KNOWLEDGE_BASE.hi;
    else if (userMessage.includes('how are you')) reply = KNOWLEDGE_BASE.status;
    else if (userMessage.includes('what can you do') || userMessage.includes('help')) reply = KNOWLEDGE_BASE.capabilities;
    else if (matches('ok') || matches('okay') || matches('kk')) reply = KNOWLEDGE_BASE.ok;
    else if (matches('thanks') || matches('thank you') || matches('ty')) reply = KNOWLEDGE_BASE.thanks;
    else if (matches('bye') || matches('goodbye') || matches('exit')) reply = KNOWLEDGE_BASE.bye;
    // 3. FALLBACK
    else reply = "Sorry, I don’t have information on that right now. Please contact the college office.";

    // Save to History in background if user is logged in
    if (email) {
        db.run(`INSERT INTO messages (user_email, message, reply) VALUES (?, ?, ?)`, [email, message, reply], (err) => {
            if (err) console.error('Error saving message:', err.message);
        });
    }

    res.json({ reply });
});

// History API
app.get('/history/:email', (req, res) => {
    const { email } = req.params;
    db.all(`SELECT message, reply, timestamp FROM messages WHERE user_email = ? ORDER BY timestamp ASC`, [email], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        res.json({ success: true, history: rows });
    });
});

// Auth Routes
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const query = `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`;
    const userRole = role || 'student';

    db.run(query, [email, password, userRole], function (err) {
        if (err) {
            return res.status(400).json({ success: false, message: 'User already exists or registration failed' });
        }
        res.json({ success: true, message: 'User registered successfully!' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;

    db.get(query, [email, password], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: { id: user.id, email: user.email, role: user.role }
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Database Initialization
db.serialize(() => {
    // 1. Ensure users table exists
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'student'
      )
    `);

    // 2. Migration: Add 'role' column to existing table if missing
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) return console.error('Error checking schema:', err.message);
        const hasRole = rows.some(row => row.name === 'role');
        if (!hasRole) {
            db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'", (err) => {
                if (err) console.error('Migration failed:', err.message);
                else console.log('Successfully added role column to users table');
            });
        }
    });

    // 3. Ensure messages table exists
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        message TEXT,
        reply TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database tables ready');
});
