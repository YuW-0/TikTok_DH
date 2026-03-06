FROM node:18-alpine

WORKDIR /opt/application

COPY package*.json ./
RUN npm ci --omit=dev

COPY . ./
COPY run.sh /opt/application/run.sh
RUN chmod +x /opt/application/run.sh

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["/opt/application/run.sh"]
