process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, '..', 'test.db');

// Delete any old test database BEFORE anything opens a connection to it
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

const request = require('supertest');
const app = require('../src/app');

afterAll(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

describe('Ticket CRUD API', () => {
    let ticketId;

    test('rejects a ticket with no title', async () => {
        const res = await request(app)
            .post('/tickets')
            .send({ description: 'missing title' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('title is required');
    });

    test('creates a ticket', async () => {
        const res = await request(app)
            .post('/tickets')
            .send({ title: 'Test ticket', priority: 'high' });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Test ticket');
        expect(res.body.status).toBe('open');
        ticketId = res.body.id;
    });

    test('lists tickets', async () => {
        const res = await request(app).get('/tickets');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('gets a single ticket by id', async () => {
        const res = await request(app).get(`/tickets/${ticketId}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(ticketId);
    });

    test('returns 404 for a nonexistent ticket', async () => {
        const res = await request(app).get('/tickets/999999');
        expect(res.status).toBe(404);
    });

    test('updates a ticket', async () => {
        const res = await request(app)
            .put(`/tickets/${ticketId}`)
            .send({ status: 'in_progress' });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('in_progress');
    });

    test('closes a ticket', async () => {
        const res = await request(app).post(`/tickets/${ticketId}/close`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('closed');
    });

    test('deletes a ticket', async () => {
        const res = await request(app).delete(`/tickets/${ticketId}`);
        expect(res.status).toBe(204);
    });

    test('confirms the ticket is gone', async () => {
        const res = await request(app).get(`/tickets/${ticketId}`);
        expect(res.status).toBe(404);
    });
});