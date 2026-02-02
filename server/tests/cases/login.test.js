const API_URL = 'http://localhost:5000/api/auth';

async function run() {
    const results = [];
    const timestamp = Date.now();

    // Create a fresh user for login testing
    const testUser = {
        name: 'Login Test User',
        email: `login_test_${timestamp}@example.com`,
        password: 'Password@123'
    };

    // Pre-register user
    await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    const tests = [
        {
            name: 'Login - Success',
            fn: async () => {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: testUser.email,
                        password: testUser.password
                    })
                });
                const data = await res.json();
                if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                if (!data.token) throw new Error('Token missing in response');
                return data;
            }
        },
        {
            name: 'Login - Failure (Wrong Password)',
            fn: async () => {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: testUser.email,
                        password: 'WrongPassword'
                    })
                });
                const data = await res.json();
                if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                return data;
            }
        },
        {
            name: 'Login - Failure (Invalid User)',
            fn: async () => {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'nonexistent@example.com',
                        password: 'Password@123'
                    })
                });
                const data = await res.json();
                if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                return data;
            }
        },
        {
            name: 'Login - Session Verification (Profile Access)',
            fn: async () => {
                // Get fresh token
                const loginRes = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: testUser.email,
                        password: testUser.password
                    })
                });
                const loginData = await loginRes.json();

                // Verify token
                const res = await fetch(`${API_URL}/verify`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${loginData.token}` }
                });
                const data = await res.json();
                if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                if (!data.success) throw new Error('Verification failed');
                return data;
            }
        }
    ];

    for (const test of tests) {
        const start = Date.now();
        try {
            const details = await test.fn();
            results.push({
                name: test.name,
                status: 'passed',
                details,
                duration: Date.now() - start
            });
        } catch (err) {
            results.push({
                name: test.name,
                status: 'failed',
                error: err.message,
                duration: Date.now() - start
            });
        }
    }

    return results;
}

module.exports = { run };
