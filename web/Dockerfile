FROM node:22-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY package.json package-lock.json* ./
# Need devDependencies for `next build`
RUN npm ci || npm install

COPY src ./src
COPY next.config.js tsconfig.json .eslintrc.json next-env.d.ts ./

RUN npm run build \
 && npm prune --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
