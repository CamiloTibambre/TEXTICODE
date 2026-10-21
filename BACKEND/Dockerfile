# Imagen base: Node 24 sobre Debian (mejor compatibilidad con bcrypt y otras libs nativas que Alpine)
FROM node:24-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Primero solo las dependencias, para aprovechar la caché de Docker
COPY package*.json ./
RUN npm ci --omit=dev

# Luego el resto del código
COPY . .

# Puerto de la API
ENV PORT=3001
EXPOSE 3001

# Arranque
CMD ["node", "index.js"]