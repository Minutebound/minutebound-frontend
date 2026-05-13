FROM node:20-slim

WORKDIR /app

# ONLY copy package.json (Do NOT copy the Mac package-lock.json)
COPY package.json ./

# Install dependencies freshly for Linux
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Declare the build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Set them as environment variables so Next.js can read them during the build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Build the production application
RUN npm run build

EXPOSE 3000

# Start the production server
CMD ["npm", "run", "dev"]