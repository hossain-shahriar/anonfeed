# Use Node.js 18 base image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the entire project files into the container
COPY . .

# Pass environment variables for build if needed (MongoDB URI for static page generation)
ARG MONGODB_URI
ARG NEXTAUTH_SECRET
ARG RESEND_API_KEY
ARG NODEMAILER_USER
ARG NODEMAILER_PASS
ARG OPENAI_API_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET

ENV MONGODB_URI=$MONGODB_URI
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV NODEMAILER_USER=$NODEMAILER_USER
ENV NODEMAILER_PASS=$NODEMAILER_PASS
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_API_KEY=$NEXT_PUBLIC_CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET


# Build the Next.js app
RUN npm run build

# Stage 2: Setup production environment
FROM node:18-alpine

# Set the working directory in the final image
WORKDIR /app

# Copy the production build from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port 3000 for the Next.js app
EXPOSE 3000

# Set environment variables for runtime
ENV NODE_ENV=production
ENV MONGODB_URI=$MONGODB_URI
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV NODEMAILER_USER=$NODEMAILER_USER
ENV NODEMAILER_PASS=$NODEMAILER_PASS
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_API_KEY=$NEXT_PUBLIC_CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET

# Start the Next.js application
CMD ["npm", "start"]
