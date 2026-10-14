// Función de Vercel: descarga el CSV publicado de Google Sheets y lo entrega al dashboard.
// Ventajas: el enlace de la hoja no queda escrito en el código, evita problemas de CORS
// y Vercel guarda la respuesta en caché 5 minutos (la hoja se consulta poco aunque entre mucha gente).
//
// Opcional: define la variable de entorno SHEET_CSV_URL en Vercel para cambiar la hoja sin tocar el código.

const DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZhG16c6gNzf_76m8fnRuDOnFbYdnDDvr-9PnoEiQOVQLL30TvE44RYisrBVXTUeuZFXvD6Mtqt7ht/pub?output=csv';

module.exports = async function handler(req, res) {
  const url = process.env.SHEET_CSV_URL || DEFAULT_URL;

  try {
    const upstream = await fetch(url, { redirect: 'follow' });
    if (!upstream.ok) throw new Error('Google Sheets respondió con el código ' + upstream.status + '.');

    const text = await upstream.text();
    if (/^\s*<(!doctype|html)/i.test(text)) {
      throw new Error('El enlace no devuelve un CSV. Revisa que la hoja esté publicada como CSV.');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).send(text);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: err.message || 'No se pudo leer la hoja de ventas.' });
  }
};
