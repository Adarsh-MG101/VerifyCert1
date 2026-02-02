const API_URL = 'http://localhost:5000/api/auth';

async function run() {
    const results = [];
    const timestamp = Date.now();
    const testUser = {
        name: 'Registration Test User',
        email: `reg_test_${timestamp}@example.com`,
        password: 'Password@123'
    };

    const tests = [
        {
            name: 'Registration - Success',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testUser)
                });
                const data = await res.json();
                if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
                return data;
            }
        },
        {
            name: 'Registration - Failure (Duplicate Email)',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testUser)
                });
                const data = await res.json();
                if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                return data;
            }
        },
        {
            name: 'Registration - Failure (Missing Fields)',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Incomplete' })
                });
                const data = await res.json();
                if (res.status < 400) throw new Error(`Expected error code, got ${res.status}`);
                return data;
            }
        },
        {
            name: 'Registration - Failure (Invalid Email: No @)',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'User', email: 'no_at_symbol.com', password: 'Password@123' })
                });
                if (res.status < 400) throw new Error(`Expected error for email without @, but got ${res.status}`);
                return await res.json();
            }
        },
        {
            name: 'Registration - Failure (Invalid Email: No Domain)',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'User', email: 'user@', password: 'Password@123' })
                });
                if (res.status < 400) throw new Error(`Expected error for email without domain, but got ${res.status}`);
                return await res.json();
            }
        },
        {
            name: 'Registration - Failure (Invalid Email: No Extension)',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'User', email: 'user@domain', password: 'Password@123' })
                });
                if (res.status < 400) throw new Error(`Expected error for email without .com/.net etc, but got ${res.status}`);
                return await res.json();
            }
        },
        {
            name: 'Registration - Failure (Invalid Email: Multiple @)',
            fn: async () => {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'User', email: 'user@@domain.com', password: 'Password@123' })
                });
                if (res.status < 400) throw new Error(`Expected error for multiple @, but got ${res.status}`);
                return await res.json();
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
