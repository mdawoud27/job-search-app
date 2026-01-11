# Base Stage
FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

# Dependencies Stage
FROM base AS dependencies

RUN npm ci --legacy-peer-deps

# Test Stage
FROM dependencies AS test

COPY . .

RUN npm run lint && npm run test

CMD ["npm", "run", "test"]

# Development Stage
FROM dependencies AS development

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