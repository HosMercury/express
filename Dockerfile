# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev
RUN npm install -g pm2  # Install PM2 globally

# Copy compiled dist folder and views directory
COPY dist ./dist
COPY ./views /app/views
COPY public ./public

# Expose the port
EXPOSE 3000

# Start the application using PM2
CMD ["pm2-runtime", "dist/app.js"]
