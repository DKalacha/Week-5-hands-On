const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const cors = require('cors')
const mysql = require('mysql2')
const dotenv = require('dotenv')

app.use(express.json())
app.use(cors())
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

db.connect((err) => {
    if (err) return console.log(err)

    console.log("Successfully connected to MySQL at : ", db.threadId);

    db.query(`USE my_expenses`, (err,result) => {
        if (err) return console.log(err);

        console.log("Database my_expenses now in use!");

        const usersTable = `
        CREATE TABLE IF NOT EXISTS users(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL,
            password VARCHAR(255)
            )
        `;

        db.query(usersTable, (err,result) => {
            if (err) return console.log(err);

            console.log("Users Table created/checked successfully");

        })
    })
})

app.post('/api/register', async(req, res) =>{
    try{
        const users = `SELECT * FROM users where email = ?`
        db.query(users, [req.body.email] , (err, data) => {
            if (data.length > 0) return res.status(409).json("User already exists");

            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            const newUser = `INSERT INTO users(email,username,password) VALUES(?)`

            value = [req.body.email, req.body.username, hashedPassword]

            db.query(newUser, [value], (err, data) => {
                if (err) return res.status(400).json("Something went wrong");
                
                return res.status(200).json("User created successfully")
            })
        })
    }
    catch(err) {
        res.status(500).json("Internal Server error!")
    }
} )

app.post('/api/login', async(req,res) => {
    try{
        const users = `SELECT * FROM users WHERE email = ?`
        db.query(users, [req.body.email], (err,data) => {
            if (data.length === 0) return res.status(404).json("User not found!")

            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)

            if(!isPasswordValid) return res.status(400).json("Invalid email or password")

            return res.status(200).json("Login successful")
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error")
    }
})
app.listen(3000, () => {
    console.log("Server is running on port 3000");
})