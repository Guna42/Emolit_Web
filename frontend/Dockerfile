# Build stage
FROM node:18-alpine as build
WORKDIR /app

# Set environment variable for backend URL (relative path in production)
ENV REACT_APP_API_URL=/api

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx configuration to handle React Router and API proxy
RUN echo 'server { \
    listen 80; \
    \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass http://backend:8000/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
