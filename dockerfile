
# Usar una imagen base oficial de Node.js
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app


# Instalar dependencias necesarias para 'ws' en Alpine
RUN apk add --no-cache python3 make g++

# Instalar la librería 'ws' globalmente o localmente.
# Para este ejemplo simple, instalamos localmente después de copiar app.js
COPY app.js ./
RUN npm install ws

# Comando para ejecutar la aplicación cuando el contenedor se inicie
CMD ["node", "app.js"]
