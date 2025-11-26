const WebSocket = require('ws');

const PORT_WS = 3000;
const UPSTREAM_HOST = 'node-a'; // De vuelta al origen
const UPSTREAM_PORT = 3000;

// Servidor WebSocket para recibir de B
const wss = new WebSocket.Server({ port: PORT_WS });

wss.on('connection', ws => {
    console.log('[C] Conexión WS entrante (desde B) establecida.');

    ws.on('message', message => {
        const jsonMessage = JSON.parse(message);
        console.log(`[C] Recibido: ${JSON.stringify(jsonMessage)}`);

        // Lógica de Negocio Paso 3
        jsonMessage.power_level -= 5; // Resta 5
        jsonMessage.audit_trail.push("C_verified");

        console.log(`[C] Modificado a power_level: ${jsonMessage.power_level}`);

        // Enviar de vuelta al Nodo A
        sendToA(jsonMessage);
    });
});

console.log(`[C] Servidor WS escuchando internamente en el puerto ${PORT_WS}`);

// Función para enviar al Nodo A (cierre del anillo)
function sendToA(message) {
    const ws = new WebSocket(`ws://${UPSTREAM_HOST}:${UPSTREAM_PORT}`);

    ws.onopen = () => {
        console.log(`[C] Conectado a A (cerrando anillo), enviando mensaje ${message._id}`);
        ws.send(JSON.stringify(message));
        ws.close();
    };

    ws.onerror = (err) => {
        console.error(`[C] Error de conexión a A: ${err.message}`);
    };
}
