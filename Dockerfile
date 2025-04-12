# Use the official Node.js image
FROM node:20-slim

# Install necessary dependencies for Puppeteer including libdrm2.
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the app code
COPY . .

# Install Node.js dependencies
RUN npm install

# Set environment variable to skip Chromium download if you want
# ENV PUPPETEER_SKIP_DOWNLOAD=true

# Expose the port (make sure this matches what your app uses)
EXPOSE 8080

# Start the app
CMD ["node", "index.js"]
