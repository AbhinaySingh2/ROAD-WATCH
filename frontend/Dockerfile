FROM node:20-alpine

# 1. Set your working directory
WORKDIR /app

# 2. Copy the package files first
COPY package*.json ./

# 3. Install dependencies BEFORE building
RUN npm install

# 4. Copy the rest of your application code
COPY . .

# 5. Now it is safe to build!
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# 6. Expose the port and start the app
EXPOSE 3000
CMD ["npm", "run", "start"]