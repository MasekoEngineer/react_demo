const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Paths for JSON files
const usersFilePath = 'users.json';
const queriesFilePath = 'queries.json';
const requestsFilePath = 'userequest.json';
// Function to initialize JSON files
const initializeFiles = () => {
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify([])); // Create an empty array
    }
    if (!fs.existsSync(queriesFilePath)) {
        const defaultQueries = {
            options: [
                { id: 1, text: "Current Fees" },
                { id: 2, text: "Missing Result" },
                { id: 3, text: "Email Problem" },
                { id: 4, text: "Directions" },
                { id: 5, text: "Faculties Chairpersons" }
            ]
        };
        fs.writeFileSync(queriesFilePath, JSON.stringify(defaultQueries, null, 2)); // Create default queries
    }
    if (!fs.existsSync(requestsFilePath)) {
        fs.writeFileSync(requestsFilePath, JSON.stringify([])); // Create an empty array for user requests
    }
};
// Function to read users from JSON file
const readUsersFromFile = () => {
    initializeFiles(); // Ensure the files exist
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
};
// Function to read queries
const readQueriesFromFile = () => {
    const data = fs.readFileSync(queriesFilePath);
    return JSON.parse(data);
};
// Function to write user requests to JSON file
const writeRequestsToFile = (request) => {
    const requests = JSON.parse(fs.readFileSync(requestsFilePath));
    requests.push(request);
    fs.writeFileSync(requestsFilePath, JSON.stringify(requests, null, 2));
};
// Serve the logreg.html file
app.get('/logreg', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logreg.html'));
});
// Serve the virtual assistant page
app.get('/virtualassist', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'virtualassist.html'));
});
// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
// Registration endpoint
app.post('/register', (req, res) => {
    const { username, email, password, isAdmin } = req.body; // Expect isAdmin in the request
    const users = readUsersFromFile();
    const existingUser = users.find(user => user.username === username || user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    // Add isAdmin to user object
    users.push({ username, email, password, isAdmin: !!isAdmin });
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.status(201).json({ message: 'User registered successfully' });
});
// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFromFile();
    const user = users.find(user => 
        (user.username === username || user.email === username) && user.password === password
    );
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Redirect based on user role
    if (user.isAdmin) {
        res.redirect('/admin'); // Redirect to admin page
    } else {
        res.redirect('/virtualassist'); // Redirect to virtual assistant page
    }
});
// Process user requests in the virtual assistant
app.post('/processQuery', (req, res) => {
    const { selection, studentName } = req.body;
    const queries = readQueriesFromFile();
    const selectedOption = queries.options.find(option => option.id === selection);
    let responseMessage = '';
    if (selectedOption) {
        switch (selectedOption.id) {
            case 1:
                responseMessage = `Please specify your faculty.`;
                break;
            case 2:
                responseMessage = `Your request for missing results will be forwarded to the appropriate department.`;
                writeRequestsToFile({ studentName, request: 'Missing Result' });
                break;
            case 3:
                responseMessage = `Your email problem will be forwarded to the appropriate department.`;
                writeRequestsToFile({ studentName, request: 'Email Problem' });
                break;
            case 4:
                responseMessage = `Here is a link to the university map. [University Map](#)`;
                break;
            case 5:
                responseMessage = `Here are the faculties and their chairpersons: <ul>
                    <li>Faculty of Science - <a href="mailto:chair@university.edu">chair@university.edu</a></li>
                    <li>Faculty of Arts - <a href="mailto:chair@university.edu">chair@university.edu</a></li>
                    <li>Faculty of Engineering - <a href="mailto:chair@university.edu">chair@university.edu</a></li>
                </ul>`;
                break;
            default:
                responseMessage = `I didn't understand that.`;
        }
    } else {
        responseMessage = `Option not found.`;
    }
    res.json({ message: responseMessage });
});
// Fetch and display requests for admin
app.get('/getRequests', (req, res) => {
    const requests = JSON.parse(fs.readFileSync(requestsFilePath));
    res.json({ requests });
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});