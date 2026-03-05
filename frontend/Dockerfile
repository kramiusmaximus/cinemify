# syntax=docker/dockerfile:1

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY . ./
# frontend is static; nginx serves it.
EXPOSE 80
