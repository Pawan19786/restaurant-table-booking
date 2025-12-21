import express from 'express';
import path from 'path';
import router from './routes/Server.js';
import { log } from 'console';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), 'public')));

app.use('/', router);

app.listen(3000, () => {
  console.log("Server running on port 3000");
  console.log("Access the application at http://localhost:3000");
});
