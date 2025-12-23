import express from 'express';
import cors from 'cors';
import { getTransfers, initDB } from './db';
import { startIndexer } from './indexer';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize DB and Indexer
initDB();
startIndexer();

app.get('/transfers/:address', (req, res) => {
    const { address } = req.params;
    try {
        const transfers = getTransfers(address);
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transfers' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
