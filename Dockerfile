# Base Stage
FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

# Development Stage
FROM base AS development

RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Production Stage
FROM base AS production

RUN apk add --no-cache python3 make g++

RUN HUSKY=0 npm ci --only=production --legacy-peer-deps

COPY src ./src

# Clean up
RUN rm -rf tests coverage

# Remove build tools to reduce image size
RUN apk del python3 make g++

EXPOSE 5000

CMD ["npm", "run", "start"]