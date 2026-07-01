# Fly.io 部署 Dockerfile
# 数据库路径: /data/edutiku.db (persistent volume)
FROM node:22-alpine

WORKDIR /app

# 创建 /data 目录 (Volume 挂载点)
RUN mkdir -p /data

# 只装生产依赖
COPY backend/package.json ./
RUN npm install --omit=dev

# 复制源码
COPY backend/src ./src

# 复制并解压初始数据库 (仅在首次部署时生效)
COPY data/edutiku.db.gz /tmp/edutiku.db.gz
RUN gunzip -f /tmp/edutiku.db.gz -c > /data/edutiku.db 2>/dev/null; \
    rm -f /tmp/edutiku.db.gz; \
    echo "DB init done"

# 健康检查
HEALTHCHECK --interval=15s --timeout=3s CMD node -e "require('http').get('http://localhost:3030/api/health',r=>{process.exit(r.statusCode===200?0:1)})"

EXPOSE 3000

CMD ["node", "src/server.js"]
