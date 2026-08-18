# Build Stage
FROM node:18-slim as build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
ENV NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
