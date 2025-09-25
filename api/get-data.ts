import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const [teamMembersRes, kitTrackerRes, arrivalsRes] = await Promise.all([
            sql`SELECT * FROM team_members ORDER BY "Order" ASC;`,
            sql`SELECT * FROM kit_tracker_entries ORDER BY "Date" DESC;`,
            sql`SELECT * FROM arrivals;`
        ]);

        res.status(200).json({
            teamMembers: teamMembersRes.rows,
            kitTracker: kitTrackerRes.rows,
            arrivals: arrivalsRes.rows
        });
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).json({ message: 'Failed to fetch data', error });
    }
}
