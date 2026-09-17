const express = require('express');
const ticketsRouter = require('./routes/tickets');

const app = express();
app.use(express.json());
app.use('/tickets', ticketsRouter);

app.get('/', (req, res) => {
    res.send('ITSM API is running');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});