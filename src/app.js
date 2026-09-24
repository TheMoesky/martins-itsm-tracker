const express = require('express');
const ticketsRouter = require('./routes/tickets');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/tickets', ticketsRouter);

//app.get('/', (req, res) => {
//    res.send('ITSM API is running with CI/CD pipeline!');
//});

app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

module.exports = app;