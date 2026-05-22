# DHYTrade

DHYTrade 是一个面向 A 股与港股的股票交易记录、仓位看板和跟仓计算系统，采用前后端分离架构。

项目包含以下能力：

- 交易记录新增、编辑、删除
- A 股与港股分市场管理
- 仓位看板、浮动盈亏、持仓天数展示
- 历史盈亏查询
- 跟仓计算
- 手续费配置
- 个人中心：修改邮箱与密码
- 行情刷新与港币兑人民币汇率查看
- Docker 化部署到 Linux 服务器

## 技术栈

后端：

- ASP.NET Core Web API
- Entity Framework Core
- SQLite
- JWT 鉴权

前端：

- React
- TypeScript
- Vite
- Ant Design
- Zustand
- ECharts

## 项目结构

```text
backend/
  DHYTrade.Api/        ASP.NET Core 后端
frontend/
  dhy-trade-web/       React 前端
docs/
  docker-deploy.md     Docker 部署说明
docker-compose.yml     Docker 编排文件
```

## 本地开发

### 1. 启动后端

```bash
cd backend/DHYTrade.Api
dotnet run
```

默认地址：

- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

### 2. 启动前端

```bash
cd frontend/dhy-trade-web
npm install
npm run dev
```

默认地址：

- Frontend: http://localhost:5173

前端开发环境已通过 Vite 代理把 `/api` 请求转发到 `http://localhost:5000`。

## 默认数据

项目启动时会自动确保存在超级管理员账号：

- 用户名：`admin`
- 密码：`admin123`

首次部署后建议立即修改密码，并在生产环境中替换 JWT 密钥。

## 数据库

本地开发默认使用 SQLite：

```text
backend/DHYTrade.Api/DHYTrade.db
```

## Docker 部署

项目已经提供以下 Docker 部署文件：

- [docker-compose.yml](docker-compose.yml)
- [backend/DHYTrade.Api/Dockerfile](backend/DHYTrade.Api/Dockerfile)
- [frontend/dhy-trade-web/Dockerfile](frontend/dhy-trade-web/Dockerfile)
- [frontend/dhy-trade-web/nginx.conf](frontend/dhy-trade-web/nginx.conf)
- [docs/docker-deploy.md](docs/docker-deploy.md)

快速启动：

```bash
cp .env.example .env
docker compose up -d --build
```

更多说明见 [docs/docker-deploy.md](docs/docker-deploy.md)。

## 生产环境建议

- 修改 `.env` 中的 `JWT_SECRET`
- 为服务器配置 HTTPS
- 定期备份 SQLite 数据文件或 Docker volume
- 若未来并发量增大，可把 SQLite 切换到 MySQL 或 PostgreSQL

## 当前业务要点

- 支持 `AShare` 与 `HongKong` 两类市场
- 总览按人民币折算展示，港股部分按汇率换算
- 刷新行情时会同步更新汇率
- 仓位与交易通过后端统一重算保持一致