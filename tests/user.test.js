const request = require('supertest');
const User = require('../models/User'); // Ajusta la ruta a tu modelo User
const { v4: uuidv4 } = require('uuid');

const generatePersonalCode = () => uuidv4().substring(0, 8).toUpperCase();

// Datos de prueba comunes
const commonUserData = {
    latitud: -17.7833,
    longitud: -63.1819,
    personal_code: generatePersonalCode(),
    department: 7,
};

describe('User Endpoints', () => {
    let testAdminUser, testOtherUser;
    let nonAdminToken; // Token para el usuario no admin

    beforeAll(async () => {

        // Asegurar que el token de admin exista
        if (!global.adminToken) {
            await request(global.app)
                .post('/api/auth/register')
                .send({ username: 'adminforusers', password: 'password123', role: 'admin', nombre: 'Admin', apellido: 'UserTest', ...commonUserData });
            const loginRes = await request(global.app)
                .post('/api/auth/login')
                .send({ username: 'adminforusers', password: 'password123' });
            global.adminToken = loginRes.body.token;
        }

        // Crear usuarios de prueba para gestión
        testAdminUser = await User.create({
            username: 'adminuser_test',
            password: 'hashedpassword', // En un test real, hashea esto
            role: 'admin',
            nombre: 'Test',
            apellido: 'Admin',
            ...commonUserData,
        });

        testOtherUser = await User.create({
            username: 'otheruser_test',
            password: 'hashedpassword',
            role: 'jefe_distrito',
            nombre: 'Other',
            apellido: 'User',
            ...commonUserData,
        });

        // Crea un usuario no admin y obtiene su token
        await request(global.app)
            .post('/api/auth/register')
            .send({ username: 'notadmin', password: 'password123', role: 'jefe_recinto', nombre: 'Not', apellido: 'Admin', ...commonUserData });
        const loginRes = await request(global.app)
            .post('/api/auth/login')
            .send({ username: 'notadmin', password: 'password123' });
        nonAdminToken = loginRes.body.token;
    });

    afterAll(async () => {
        // Limpiar usuarios creados por los tests
        await User.deleteMany({ username: { $in: ['adminuser_test', 'otheruser_test', 'adminforusers', 'todeleteuser', 'notadmin'] } });
    });

    // --- Tests ---

    it('should get all users for admin', async () => {
        const res = await request(global.app)
            .get('/api/users')
            .set('Authorization', `Bearer ${global.adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThanOrEqual(2); // Al menos los dos creados
    });

    it('should get a single user by ID for admin', async () => {
        const res = await request(global.app)
            .get('/api/users/' + testOtherUser._id)
            .set('Authorization', `Bearer ${global.adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body._id).toEqual(testOtherUser._id.toString());
        expect(res.body.username).toEqual('otheruser_test');
    });

    it('should update a user by ID for admin', async () => {
        const res = await request(global.app)
            .put('/api/users/' + testOtherUser._id)
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send({ role: 'jefe_circunscripcion', circunscripcionId: 1 }); // Asume una circunscripciónId válida

        expect(res.statusCode).toEqual(200);
        expect(res.body._id).toEqual(testOtherUser._id.toString());
        expect(res.body.role).toEqual('jefe_circunscripcion');
        expect(res.body.circunscripcionId).toEqual(1);
    });

    it('should delete a user by ID for admin', async () => {
        const userToDelete = await User.create({
            username: 'todeleteuser',
            password: 'hashedpassword',
            role: 'delegado_mesa',
            nombre: 'To',
            apellido: 'Delete',
            ...commonUserData,
        });

        const res = await request(global.app)
            .delete('/api/users/' + userToDelete._id)
            .set('Authorization', `Bearer ${global.adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('User removed');

        const deletedUser = await User.findById(userToDelete._id);
        expect(deletedUser).toBeNull();
    });

    it('should prevent non-admin from accessing user management endpoints', async () => {
        const res = await request(global.app)
            .get('/api/users')
            .set('Authorization', `Bearer ${nonAdminToken}`);
        expect(res.statusCode).toEqual(403); // Forbidden
        expect(res.body.message).toEqual('Not authorized to access this route');
    });
});