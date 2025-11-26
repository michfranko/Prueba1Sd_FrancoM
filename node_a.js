const WebSocket = require('ws');
const http = require('http');

const PORT_HTTP = 8080;
const PORT_WS_INTERNAL = 3000;
const UPSTREAM_HOST = 'node-b';
const UPSTREAM_PORT = 3000;

let ws_c_connection = null;

// 1. Servidor HTTP para el disparo inicial externo
const serverHttp = http.createServer((req, res) => {
    if (req.url.startsWith('/trigger') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const initialPower = data.initial_power_value;

                if (typeof initialPower !== 'number') {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Se esperaba un valor numerico en el body: {"initial_power_value": N}');
                    return;
                }

                // Generar UUID simple para el _id
                const message = {
                    _id: `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    power_level: initialPower,
                    audit_trail: []
                };

                console.log(`[A] Iniciando ciclo con power_level: ${initialPower}`);
                // Enviar al Nodo B via WS
                sendToB(message);

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(`Mensaje ${message._id} iniciado y enviado a Nodo B.`);

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error parsing request body.');
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

serverHttp.listen(PORT_HTTP, () => {
    console.log(`[A] Servidor HTTP escuchando en el puerto ${PORT_HTTP} (Externo) para triggers.`);
});

// Función para enviar al Nodo B (intentar reconectar si es necesario)
function sendToB(message) {
    const ws = new WebSocket(`ws://${UPSTREAM_HOST}:${UPSTREAM_PORT}`);

    ws.onopen = () => {
        console.log(`[A] Conectado a B, enviando mensaje ${message._id}`);
        ws.send(JSON.stringify(message));
    };

    ws.onerror = (err) => {
        console.error(`[A] Error de conexión a B: ${err.message}`);
    };

    ws.onclose = () => {
        // La conexión a B es efímera, se cierra después de enviar.
    };
}


// 2. Servidor WebSocket para recibir del Nodo C (cierre del anillo)
const wss = new WebSocket.Server({ port: PORT_WS_INTERNAL });

wss.on('connection', ws => {
    ws_c_connection = ws;
    console.log('[A] Conexión WS entrante desde Nodo C establecida.');

    ws.on('message', message => {
        const jsonMessage = JSON.parse(message);
        // Lógica de cierre y validación final
        console.log(`\n--- CICLO COMPLETADO: ${jsonMessage.power_level} ---`);
        console.log(`ID: ${jsonMessage._id}, Auditoría: ${jsonMessage.audit_trail.join(' -> ')}\n`);
        ws.close(); // Cerrar la conexión después de procesar el ciclo.
    });

    ws.on('close', () => {
        ws_c_connection = null;
    });
});

console.log(`[A] Servidor WS (para recibir de C) escuchando internamente en el puerto ${PORT_WS_INTERNAL}`);

