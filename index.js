import express from 'express';
import { engine } from 'express-handlebars';
import { autoExec, close } from './database/index.js';
import { userRouter } from './routes/user.route.js';

const serverPort = 3000;
const serverUrl = `http://localhost:${3000}`;

// Execute the database migrations
autoExec().catch(close);

// Create the express app
const app = express();

// Setup handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Serve the static files
app.use(express.static('public'));

// Add the routes
app.use('/api/users', userRouter);

// Setup views
app.get('/', async (req, res) => {
    const response = await fetch(`${serverUrl}/api/users/list`);
    const usersJson = await response.json();
    res.render('home', { users: usersJson });
});

app.get('/details/:id', async (req, res) => {
    const userId = req.params.id;
    const response = await fetch(`${serverUrl}/api/users/details/${userId}`);
    const userJson = await response.json();
    res.render('details', { res: userJson.message ? userJson : Object.values(userJson)[0] });
});

// Start the server
app.listen(serverPort, () => {
    console.log(`Server is running on ${serverUrl}`);
});