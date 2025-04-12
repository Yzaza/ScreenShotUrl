# Use the official Node.js slim image
FROM node:20-slim

# Install all necessary dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxshmfence1 \
    libgbm1 \
    libdrm2 \
    libxkbcommon0 \
    xdg-utils \
    --no-install-recommends \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the application code into the container
COPY . .

# Install Node.js dependencies
RUN npm install

# Expose the port (match this to the port your app is listening on)
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
