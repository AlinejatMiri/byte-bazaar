FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8081/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build
EXPOSE 4173
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=4173
CMD ["npm","run","preview"]
