# 1. Etap budowania (Build Stage)
FROM node:24-slim AS build

# Instalujemy narzędzia potrzebne do budowania (opcjonalne, ale przydatne)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopiujemy pliki zależności
COPY package*.json ./

# Instalujemy zależności
RUN npm install

# Kopiujemy resztę kodu źródłowego
COPY . .

# Budujemy aplikację Astro
# Astro wygeneruje pliki w folderze dist/
RUN npm run build

# 2. Etap uruchamiania (Runtime Stage)
FROM node:24-slim AS runtime

WORKDIR /app

# Kopiujemy zbudowaną aplikację i niezbędne pliki z etapu build
# Używamy adaptera Node.js w trybie standalone, więc kopiujemy dist i node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Konfiguracja środowiska
# Astro Node adapter domyślnie słucha na 0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

# Informujemy Docker, na którym porcie działa aplikacja
EXPOSE 4321

# Komenda startowa
# Plik entry.mjs jest domyślnym punktem wejścia dla Astro Node adapter
CMD ["node", "./dist/server/entry.mjs"]
