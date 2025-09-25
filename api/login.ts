import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Case-insensitive username check
        const { rows } = await sql`
            SELECT * FROM team_members WHERE lower(username) = lower(${username}) AND password = ${password};
        `;

        if (rows.length > 0) {
            const user = rows[0];
            // Don't send the password back to the client
            delete user.password;
            res.status(200).json(user);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ message: 'An error occurred during login', error });
    }
}
