FROM node:latest as builder
LABEL authors="<your name>"

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL="<your deployment url>"
RUN npm run build

FROM nginx:alpine as prod
COPY nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /dist /usr/share/nginx/html/ennakoi-puzzle
EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]