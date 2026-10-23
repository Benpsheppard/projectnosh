require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV})`);
});
