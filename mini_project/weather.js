// server.js

// Dependencies (Ensure 'npm install express axios' has been run)
import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server aur API Key setup
const app = express();
const PORT = 3000;
// *** REPLACE WITH YOUR ACTUAL OPENWEATHERMAP KEY ***
const API_KEY = process.env.WEATHER_API_KEY; 

// Static files (public folder) ko serve karna
// Aapko apni index.html file ko 'public' folder ke andar rakhna hoga.
// Server.js file ke barabar mein maujood files ko serve karein
// FIX: Ek directory upar jaakar ('..') phir 'public' folder ko point karein.
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json()); 


// API Endpoint: Browser yahan request bhejega /weather?city=CITYNAME
app.get('/weather', async (req, res) => {
    
    const city = req.query.city; 

    if (!city) {
        return res.status(400).json({ error: 'City name is required.' });
    }

    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        // External API call karna
        const response = await axios.get(URL);
        const data = response.data;
        
        // Zaruri info nikalna aur clean format mein bhejna
        const weatherInfo = {
            Location: data.name,
            Temperature: `${data.main.temp}°C`,
            Condition: data.weather[0].description,
            Humidity: `${data.main.humidity}%`
        };

        // Clean JSON object ko front-end (browser) ko wapas bhejna
        res.json(weatherInfo);

    } catch (error) {
        // Error handling
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: `City '${city}' not found.` });
        }
        return res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
});

// Server start karna
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/index.html in your browser.`);
});