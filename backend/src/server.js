// 学习资料站后端入口
import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = Fastify({
  logger: {
    level: 'info'
  }
});

// CORS
await server.register(cors, {
  origin: true,
  credentials: true
});

// 响应格式中间件
server.decorateReply('ok', function(data, msg = 'success') {
  return this.send({ code: 0, msg, data });
});
server.decorateReply('fail', function(code = 1, msg = 'error', statusCode = 400) {
  return this.status(statusCode).send({ code, msg });
});

// JWT验证
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'StudyHub-dev-secret-2026';

server.decorate('jwt', { sign: (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }), verify: (token) => jwt.verify(token, JWT_SECRET) });

// 认证中间件
server.decorate('authenticate', async function(request, reply) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return reply.fail(401, '请先登录', 401);
  }
  try {
    const decoded = server.jwt.verify(auth.slice(7));
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return reply.fail(401, '用户不存在', 401);
    request.user = user;
  } catch (e) {
    return reply.fail(401, '登录已过期，请重新登录', 401);
  }
});

// 路由
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import paperRoutes from './routes/papers.js';
import orderRoutes from './routes/orders.js';
import inviteRoutes from './routes/invite.js';
import regionRoutes from './routes/regions.js';
import chatRoutes from './routes/chat.js';
import aiRoutes from './routes/ai.js';
import productRoutes from './routes/products.js';

await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(questionRoutes, { prefix: '/api/questions' });
await server.register(paperRoutes, { prefix: '/api/papers' });
await server.register(orderRoutes, { prefix: '/api/orders' });
await server.register(inviteRoutes, { prefix: '/api/invite' });
await server.register(regionRoutes, { prefix: '/api/regions' });
await server.register(chatRoutes, { prefix: '/api/chat' });
await server.register(aiRoutes, { prefix: '/api/ai' });
await server.register(productRoutes, { prefix: '/api/products' });

// 健康检查
server.get('/api/health', async (request, reply) => reply.ok({ status: 'ok', time: new Date().toISOString() }));

// 启动
const PORT = process.env.PORT || 3030;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await server.listen({ port: PORT, host: HOST });
  console.log('?? StudyHub API is started: http://localhost:' + PORT);
  console.log('?? Database: ' + path.resolve(__dirname, '..', '..', 'data', 'edutiku.db'));
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
