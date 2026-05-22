# DHYTrade Docker 部署

本项目支持使用 Docker Compose 在 Linux 服务器上部署。

## 结构

- 前端：React + Vite，构建后由 Nginx 提供静态资源服务。
- 后端：ASP.NET Core Web API。
- 数据库：SQLite，挂载到 Docker volume 持久化保存。

## 前置条件

- Linux 服务器已安装 Docker。
- Linux 服务器已安装 Docker Compose Plugin。
- 服务器开放 80 端口。

可用以下命令检查：

```bash
docker --version
docker compose version
```

## 首次部署

1. 上传项目到服务器。
2. 进入项目根目录。
3. 复制环境变量模板。

```bash
cp .env.example .env
```

4. 修改 `.env`，至少替换 `JWT_SECRET`。
5. 启动服务。

```bash
docker compose up -d --build
```

启动后：

- 前端访问地址：`http://服务器IP/`
- 后端 Swagger：`http://服务器IP/api` 通过前端 Nginx 反代访问 API，Swagger 本身仍在后端容器内部的 `http://backend:5000/swagger`

如果你要直接映射 Swagger 到公网，可以后续再加独立端口。

## 常用命令

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
```

仅查看后端日志：

```bash
docker compose logs -f backend
```

仅查看前端日志：

```bash
docker compose logs -f frontend
```

停止服务：

```bash
docker compose down
```

重新构建并启动：

```bash
docker compose up -d --build
```

## 数据持久化

SQLite 数据库文件存放在 Docker volume `dhytrade-data` 中，容器内路径为：

```text
/app/data/DHYTrade.db
```

查看 volume：

```bash
docker volume ls
```

查看 volume 实际挂载位置：

```bash
docker volume inspect dhytrade_dhytrade-data
```

实际 volume 名称可能会带上目录前缀，以上命令结果为准。

## 更新部署

拉取最新代码后执行：

```bash
docker compose down
docker compose up -d --build
```

## 反向代理说明

前端容器内的 Nginx 会把 `/api/*` 请求转发到后端容器，因此浏览器端不需要单独配置 API 地址。

## 建议

- 生产环境务必修改 `JWT_SECRET`。
- 建议在服务器前面再加一层 HTTPS 代理，例如 Nginx Proxy Manager、Caddy 或宝塔站点反代。
- 如果后续要接入 MySQL/PostgreSQL，再把 `ConnectionStrings__Default` 改成对应连接字符串即可。