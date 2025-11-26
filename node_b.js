const WebSocket = require('ws');

const PORT_WS = 3000;
const UPSTREAM_HOST = 'node-c';
const UPSTREAM_PORT = 3000;

// Servidor WebSocket para recibir de A
const wss = new WebSocket.Server({ port: PORT_WS });

wss.on('connection', ws => {
    console.log('[B] Conexión WS entrante (desde A) establecida.');

    ws.on('message', message => {
        const jsonMessage = JSON.parse(message);
        console.log(`[B] Recibido: ${JSON.stringify(jsonMessage)}`);

        // Lógica de Negocio Paso 2
        let { power_level, audit_trail } = jsonMessage;

        if (power_level % 2 === 0) {
            jsonMessage.power_level = power_level * 2; // PAR: Multiplica por 2
        } else {
            jsonMessage.power_level = power_level + 1; // IMPAR: Suma 1
        }

        jsonMessage.audit_trail.push("B_processed");

        console.log(`[B] Modificado a power_level: ${jsonMessage.power_level}`);

        // Enviar al Nodo C
        sendToC(jsonMessage);
    });
});

console.log(`[B] Servidor WS escuchando internamente en el puerto ${PORT_WS}`);

// Función para enviar al Nodo C (se conecta efímeramente)
function sendToC(message) {
    const ws = new WebSocket(`ws://${UPSTREAM_HOST}:${UPSTREAM_PORT}`);

    ws.onopen = () => {
        console.log(`[B] Conectado a C, enviando mensaje ${message._id}`);
        ws.send(JSON.stringify(message));
    };

    ws.onerror = (err) => {
        console.error(`[B] Error de conexión a C: ${err.message}`);
    };
}
