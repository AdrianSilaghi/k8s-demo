FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first
COPY package.json ./
RUN npm install --only=production

# Copy application code
COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]


