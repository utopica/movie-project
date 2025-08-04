require('dotenv').config();

const app = require ('./src/app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });