import express from 'express';
import { query } from '../database/index.js';

const router = express.Router();

router.get('/list', async (req, res) => {
    const users = await query('SELECT * FROM users');
    res.json(users);
});

router.get('/details/:id', async (req, res) => {
    const userId = req.params.id;
    const user = await query(`SELECT * FROM users WHERE id = ${userId}`);

    if (!user || user.length === 0) {
        res.status(404).json({ message: 'User not found', code: 404 });
        return;
    }

    res.json(user);
});

export {
    router as userRouter
}