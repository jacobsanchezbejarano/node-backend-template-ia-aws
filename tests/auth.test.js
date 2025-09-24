const request = require('supertest');
const User = require('../models/User'); // Ajusta la ruta a tu modelo User
const { v4: uuidv4 } = require('uuid');

const generatePersonalCode = () => uuidv4().substring(0, 8).toUpperCase();

describe('Auth Endpoints', () => {
    // Limpiar la colección de usuarios antes de cada test de auth
    beforeAll(async () => {
        await User.deleteMany({});
    });

    const commonUserData = {
        latitud: -17.7833,
        longitud: -63.1819,
        personal_code: generatePersonalCode(),
        department: 7,
    };

    it('should register a new admin user', async () => {
        const res = await request(global.app)
            .post('/api/auth/register')
            .send({
                username: 'testadmin',
                password: 'password123',
                role: 'admin',
                nombre: 'Test',
                apellido: 'Admin',
                ...commonUserData
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.username).toEqual('testadmin');
        global.adminToken = res.body.token; // Guardar token para tests posteriores
    });

    it('should login an existing admin user and return a token', async () => {
        // Primero, registra el usuario si no existe
        await request(global.app)
            .post('/api/auth/register')
            .send({
                username: 'loginadmin',
                password: 'password123',
                role: 'admin',
                nombre: 'Login',
                apellido: 'Admin',
                ...commonUserData
            });

        const res = await request(global.app)
            .post('/api/auth/login')
            .send({
                username: 'loginadmin',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        global.loginAdminToken = res.body.token; // Guardar token para tests posteriores
    });

    it('should register a new jefe de recinto and save their assigned data', async () => {
        const res = await request(global.app)
            .post('/api/auth/register')
            .send({
                username: 'jeferecinto_test',
                password: 'password123',
                role: 'jefe_recinto',
                nombre: 'Jefe',
                apellido: 'Recinto Test',
                circunscripcionId: 1, // Asume un ID de circunscripción existente
                recintoId: 101, // Asume un ID de recinto existente
                idLoc: 1234, // Asume un ID de localidad existente
                ...commonUserData
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.role).toEqual('jefe_recinto');
        expect(res.body.recintoId).toEqual(101);
        expect(res.body.idLoc).toEqual(1234);
        global.jefeRecintoToken = res.body.token;
    });

    it('should register a new delegado de mesa and save their assigned data', async () => {
        const res = await request(global.app)
            .post('/api/auth/register')
            .send({
                username: 'delegadomesa_test',
                password: 'password123',
                role: 'delegado_mesa',
                nombre: 'Delegado',
                apellido: 'Mesa Test',
                circunscripcionId: 1,
                recintoId: 101,
                idLoc: 1234,
                mesaNumero: 5, // Asume un número de mesa existente
                ...commonUserData
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.role).toEqual('delegado_mesa');
        expect(res.body.recintoId).toEqual(101);
        expect(res.body.idLoc).toEqual(1234);
        expect(res.body.mesaNumero).toEqual(5);
        global.delegadoMesaToken = res.body.token;
    });

    it('should logout a user', async () => {
        // Primero, asegúrate de que haya un token global para probar el logout
        if (!global.loginAdminToken) {
            await request(global.app)
                .post('/api/auth/register')
                .send({ username: 'logoutuser', password: 'password123', role: 'admin', nombre: 'Logout', apellido: 'User', ...commonUserData });
            const loginRes = await request(global.app)
                .post('/api/auth/login')
                .send({ username: 'logoutuser', password: 'password123' });
            global.loginAdminToken = loginRes.body.token;
        }

        const res = await request(global.app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${global.loginAdminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Logged out successfully');
    });

    it('should not register with existing username', async () => {
        await request(global.app)
            .post('/api/auth/register')
            .send({ username: 'duplicateuser', password: 'password123', role: 'admin', nombre: 'Dup', apellido: 'User', ...commonUserData });

        const res = await request(global.app)
            .post('/api/auth/register')
            .send({ username: 'duplicateuser', password: 'password123', role: 'admin', nombre: 'Dup', apellido: 'User', ...commonUserData });
        expect(res.statusCode).toEqual(400); // O 409 Conflict, según tu implementación
        expect(res.body).toHaveProperty('message');
    });

    it('should not login with invalid credentials', async () => {
        const res = await request(global.app)
            .post('/api/auth/login')
            .send({
                username: 'nonexistent',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Invalid credentials');
    });
});