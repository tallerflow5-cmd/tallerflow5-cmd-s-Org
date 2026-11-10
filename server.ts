import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parser with 25MB limit for high-res photos/documents
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini client initialization as required by gemini-api skill
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Endpoint OCR inteligente con Gemini (estilo Paperless-ngx)
 * Extrae datos estructurados de órdenes de servicio históricas o facturas de repuestos
 */
app.post('/api/ocr/scan', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', documentTypeHint = 'auto' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Falta la imagen codificada en base64' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Servicio de IA no disponible. Verifique que GEMINI_API_KEY esté configurada.',
      });
    }

    // Clean base64 header if present (e.g. "data:image/jpeg;base64,...")
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const systemPrompt = `Eres un asistente de digitalización y OCR de alta precisión para talleres de servicio técnico de electrodomésticos de línea blanca (lavadoras, neveras, secadoras, microondas, marcas como LG, Samsung, Whirlpool, Mabe, etc.).
Tu tarea es analizar la foto de un documento (puede ser una orden de servicio antigua manuscrita o impresa, una factura de repuestos de proveedor o un comprobante de taller) y extraer de forma estructurada toda la información disponible.

Reglas:
1. Identifica el tipo de documento: "orden_servicio_fisica" o "factura_proveedor".
2. Si es una orden de servicio, extrae los datos del cliente, del electrodoméstico (tipo, marca, modelo, serial), la falla reportada o diagnóstico, repuestos utilizados con costos y mano de obra.
3. Si es una factura de repuestos, extrae los ítems de repuestos, cantidades, precios unitarios y total.
4. Normaliza marcas a sus nombres conocidos (ej. LG, Samsung, Whirlpool, Mabe, Electrolux, Haceb).
5. Extrae números limpios (sin símbolos de moneda) para precios y cantidades.
6. Si un dato no es legible o no existe, usa cadena vacía o 0 según corresponda.`;

    const userPrompt = `Analiza este documento escaneado/fotografiado de taller de electrodomésticos (Pista de tipo: ${documentTypeHint}). Extrae todos los datos estructurados posibles.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tipoDocumento: {
              type: Type.STRING,
              description: 'Tipo de documento: "orden_servicio_fisica" o "factura_proveedor"',
            },
            confianza: {
              type: Type.INTEGER,
              description: 'Nivel estimado de confianza del 0 al 100 basado en legibilidad',
            },
            codigoReferencia: {
              type: Type.STRING,
              description: 'Número o folio de la orden o factura visible',
            },
            fechaDocumento: {
              type: Type.STRING,
              description: 'Fecha que aparece en el documento (formato YYYY-MM-DD o DD/MM/YYYY)',
            },
            cliente: {
              type: Type.OBJECT,
              properties: {
                nombre: { type: Type.STRING },
                documento: { type: Type.STRING, description: 'Cédula, DNI o NIT' },
                telefono: { type: Type.STRING },
                direccion: { type: Type.STRING },
              },
            },
            equipo: {
              type: Type.OBJECT,
              properties: {
                tipo: { type: Type.STRING, description: 'Lavadora, Nevera, Secadora, etc.' },
                marca: { type: Type.STRING, description: 'LG, Samsung, Whirlpool, Mabe, etc.' },
                modelo: { type: Type.STRING },
                numeroSerie: { type: Type.STRING },
                fallaReportada: { type: Type.STRING },
              },
            },
            diagnosticoOTrabajo: {
              type: Type.STRING,
              description: 'Notas técnicas, diagnóstico o descripción del trabajo realizado',
            },
            repuestos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  codigo: { type: Type.STRING },
                  nombre: { type: Type.STRING },
                  marcaCompatible: { type: Type.STRING },
                  cantidad: { type: Type.NUMBER },
                  precioUnitario: { type: Type.NUMBER },
                  subtotal: { type: Type.NUMBER },
                },
              },
            },
            manoDeObra: {
              type: Type.NUMBER,
              description: 'Valor cobrado por concepto de servicio técnico / mano de obra',
            },
            total: {
              type: Type.NUMBER,
              description: 'Valor total del documento',
            },
            observaciones: {
              type: Type.STRING,
              description: 'Notas adicionales, garantías mencionadas o condiciones',
            },
          },
          required: ['tipoDocumento', 'confianza', 'codigoReferencia'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error al procesar OCR con Gemini:', error);
    return res.status(500).json({
      error: 'Error al procesar el documento',
      details: error?.message || 'Error interno del motor de análisis OCR',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'TallerFlow MVP', timestamp: new Date().toISOString() });
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TallerFlow backend corriendo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
