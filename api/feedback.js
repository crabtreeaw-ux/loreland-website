export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { experienceDescription, regularBasisRating, fairPrice, shareWith, betaTesterEmail } = req.body ?? {};

  const airtableKey    = process.env.AIRTABLE_API_KEY;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;

  if (!airtableKey || !airtableBaseId) {
    console.error('Feedback error: AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not configured');
    return res.status(500).json({ error: 'Server configuration error — Airtable credentials missing' });
  }

  try {
    const atRes = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent('Responses')}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${airtableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Experience Description': experienceDescription ?? '',
            'Regular Basis Rating':   regularBasisRating ? Number(regularBasisRating) : null,
            'Fair Price':             fairPrice           ?? '',
            'Share With':             shareWith           ?? '',
            'Beta Tester Email':      betaTesterEmail     ?? '',
            'Genre':                  'website',
            'Timestamp':              new Date().toISOString(),
          },
        }),
      }
    );

    if (!atRes.ok) {
      const errBody = await atRes.text();
      try {
        const errJson = JSON.parse(errBody);
        console.error(`Airtable error ${atRes.status}:`, errJson.error?.type, errJson.error?.message);
      } catch {
        console.error(`Airtable error ${atRes.status}:`, errBody);
      }
      return res.status(502).json({ error: 'Failed to save feedback' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Feedback error:', err);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
}
