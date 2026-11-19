/**
 * The visitor's country, for pre-selecting the phone country code in the registration form.
 *
 * Vercel resolves the country from the request IP at its edge and passes it in a header, so
 * nothing is sent to a third-party IP-lookup service and the IP itself is never read or stored
 * here. Returns {"country": "MA"} (ISO 3166-1 alpha-2), or {"country": null} when unknown
 * (e.g. local development). Never cached: it differs per visitor.
 */
module.exports = (req, res) => {
  const raw = req.headers['x-vercel-ip-country'];
  const country = typeof raw === 'string' && /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : null;
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ country });
};
