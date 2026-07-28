# Ubuntu 22.04 Docker 部署说明

本包用于在 Ubuntu 22.04 云服务器上以 Docker Compose 方式部署平台。部署入口文件：

- `compose.yml`
- `Dockerfile.local`
- `.env.example`
- `appsettings.json`

## 1. 服务器准备

建议配置：

- Ubuntu 22.04 LTS
- 2 核 4G 起步，正式比赛建议 4 核 8G 或更高
- 磁盘 40G 起步，容器题和附件较多时建议 100G+

开放端口：

- `80/tcp`：平台 Web 入口，当前 Compose 默认把服务器 `80` 端口映射到平台容器 `8080` 端口
- `443/tcp`：如果后续使用 Nginx/Caddy 反向代理和 HTTPS
- 容器题目端口：如果 `GZCTF_PORT_MAPPING_TYPE=Default`，容器题会映射到宿主机端口，需要在云安全组放行对应题目端口；如果改用 `PlatformProxy`，通常只需要 Web 入口

## 2. 安装 Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg openssl ufw
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

## 3. 上传并解压源码包

> 生成源码包：在开发机的源码目录执行 `./build-release.sh`，会在上级目录生成
> `ctf-platform-<日期>-<时分>.tar.gz`。包内**不含** `node_modules`、前端构建产物、
> 数据库数据和 `.env`，约 5MB。

在你的本机执行上传，替换服务器 IP 和实际包名：

```bash
scp ctf-platform-20260728-1030.tar.gz root@服务器IP:/opt/
```

登录服务器：

```bash
ssh root@服务器IP
cd /opt
tar -xzf ctf-platform-20260728-1030.tar.gz
cd ctf-platform-20260728-1030
```

如果你用的是普通用户，建议放到 `/opt/` 下，并确保该用户能执行 Docker。

后续文档中出现的 `/opt/gzctf-ctf-platform` 路径，请替换成你实际解压出的目录名。

## 4. 初始化环境变量

```bash
cp .env.example .env
```

生成随机密钥：

```bash
POSTGRES_PASSWORD_VALUE=$(openssl rand -hex 24)
XOR_KEY_VALUE=$(openssl rand -hex 32)
echo "$POSTGRES_PASSWORD_VALUE"
echo "$XOR_KEY_VALUE"
```

编辑 `.env`：

```bash
nano .env
```

需要重点修改：

```dotenv
POSTGRES_PASSWORD=上面生成的数据库密码
GZCTF_ADMIN_PASSWORD=你的管理员初始密码
GZCTF_XOR_KEY=上面生成的64位随机字符串
GZCTF_PUBLIC_ENTRY=服务器公网IP或域名
GZCTF_PORT_MAPPING_TYPE=Default
GZCTF_WEB_PORT=80
```

管理员账号首次启动时自动创建，用户名为 `Admin`。如果你要沿用之前指定的密码，可设置：

```dotenv
GZCTF_ADMIN_PASSWORD=你的管理员初始密码
```

注意：`GZCTF_XOR_KEY` 部署后不要随意变更，否则会影响已生成的动态 Flag/签名数据。

## 5. 创建数据目录并启动

```bash
mkdir -p data/files data/db
sudo docker compose config
sudo docker compose up -d --build
sudo docker compose ps
```

确认状态为 `healthy`：

```bash
sudo docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' gzctf-platform-gzctf-1 2>/dev/null || \
sudo docker compose ps
```

访问：

```text
http://服务器IP
```

如果容器名不是 `gzctf-platform-gzctf-1`，以 `sudo docker compose ps` 显示为准。

## 6. 首次登录后的平台配置

平台启动后用 `Admin` 登录，进入 **管理后台 → 系统设置**，按下面三块配置品牌。

### 6.1 平台名称与首页文案是分开的

本版本把「平台名称」和「首页大屏文字」拆成了两组独立配置，互不影响：

| 配置项 | 位置 | 作用范围 |
| --- | --- | --- |
| 平台名称 | 系统设置 → 平台信息 | 浏览器标题、导航栏、页脚、邮件 |
| 平台标语 | 系统设置 → 平台信息 | 全站通用标语 |
| **首页主标题** | 系统设置 → **首页文案** | **仅**首页大屏正中的大字 |
| **首页副标题** | 系统设置 → **首页文案** | **仅**主标题下方那句话 |
| 顶部年度标签 | 系统设置 → 首页文案 | 首页左上角，如「2026 首届」，留空显示当前年份 |
| 英文副标 | 系统设置 → 首页文案 | 年度标签右侧英文小字 |
| 主/次按钮文字 | 系统设置 → 首页文案 | 首页两个按钮的文字 |
| 特色卡片 | 系统设置 → 首页文案 | 每行一张卡片，格式 `标题|描述` |

首页主标题 / 副标题留空时，自动回退到平台名称 / 平台标语。所以只想改首页大字、不想动浏览器标题时，只填「首页主标题」即可。

### 6.2 替换 Logo 与站点图标

**方式一（推荐，无需重新构建）**：管理后台 → 系统设置 → 平台信息 → **Logo**，直接上传图片。上传后全站导航栏、登录页、页脚的图标会立即替换，浏览器标签页图标也会跟着变。旁边的「重置」按钮可恢复默认。

建议图片规格：

- 正方形或接近正方形，PNG / WebP，带透明背景
- 不小于 256×256，512×512 最佳
- 后台会自动生成 20 / 40 / 60 / 80px 预览，上传后确认小尺寸下依然清晰

**方式二（改默认值，需重新构建）**：替换源码里的默认图标文件，适合要求「未上传任何 Logo 时也显示自家标识」的场景。

```bash
# 站点图标（浏览器标签页）
src/GZCTF/Resources/favicon.webp
src/GZCTF/Resources/favicon-source.svg

# 站内默认 Logo 组件（SVG）
src/GZCTF/ClientApp/src/components/icon/MainIcon.tsx
```

替换后重新构建：

```bash
sudo docker compose up -d --build
```

### 6.3 建议同步检查的项

- **赛事时间**：管理后台 → 赛事管理 → 编辑赛事，确认开始 / 结束时间和报名开关
- **注册策略**：系统设置 → 账户策略，按需开启邮箱验证 / 验证码 / 邮箱域名白名单
- **容器策略**：系统设置 → 容器策略，设置靶机默认时长与单人容器上限

## 7. 防火墙和云安全组

Ubuntu 防火墙：

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

云服务器控制台也要同步放行 `80/tcp`。

如果使用容器类 CTF 题，并且 `GZCTF_PORT_MAPPING_TYPE=Default`，还需要按比赛需要放行容器题端口。为了减少开放端口，可以尝试改成：

```dotenv
GZCTF_PORT_MAPPING_TYPE=PlatformProxy
```

修改后重启：

```bash
sudo docker compose up -d
```

## 8. 可选：Nginx HTTPS 反向代理

当前部署包默认由 Docker 直接占用服务器 `80` 端口。如果你后续要使用 Nginx/Caddy 做 HTTPS 反向代理，需要先把 `.env` 改为：

```dotenv
GZCTF_WEB_PORT=8080
```

然后重启平台：

```bash
sudo docker compose up -d
```

这样平台监听 `127.0.0.1:8080`，Nginx 再占用服务器 `80/443`。

安装 Nginx：

```bash
sudo apt install -y nginx
```

创建配置：

```bash
sudo nano /etc/nginx/sites-available/gzctf
```

写入，替换域名：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 256m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用：

```bash
sudo ln -s /etc/nginx/sites-available/gzctf /etc/nginx/sites-enabled/gzctf
sudo nginx -t
sudo systemctl reload nginx
```

申请 HTTPS 证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

使用域名时，把 `.env` 中的 `GZCTF_PUBLIC_ENTRY` 改为域名。

## 9. 常用维护命令

查看服务：

```bash
sudo docker compose ps
```

查看日志：

```bash
sudo docker compose logs -f gzctf
```

重启平台：

```bash
sudo docker compose restart gzctf
```

停止全部服务：

```bash
sudo docker compose down
```

重新构建并启动：

```bash
sudo docker compose up -d --build
```

## 10. 数据备份与恢复

备份数据库和附件：

```bash
cd /opt/gzctf-ctf-platform
sudo tar -czf /opt/gzctf-data-backup-$(date +%F-%H%M%S).tar.gz data .env appsettings.json
```

恢复时先停止服务：

```bash
sudo docker compose down
sudo tar -xzf /opt/gzctf-data-backup-备份时间.tar.gz -C /opt/gzctf-ctf-platform
sudo docker compose up -d
```

## 11. 更新源码包

上传新包后：

```bash
cd /opt
sudo docker compose -f /opt/gzctf-ctf-platform/compose.yml down
mv gzctf-ctf-platform gzctf-ctf-platform.old.$(date +%F-%H%M%S)
tar -xzf gzctf-ctf-platform-ubuntu22-新日期.tar.gz
cp gzctf-ctf-platform.old.*/.env gzctf-ctf-platform/.env
cp -a gzctf-ctf-platform.old.*/data gzctf-ctf-platform/data
cd gzctf-ctf-platform
sudo docker compose up -d --build
```

确认无误后再删除旧目录。

## 12. 排错

看启动日志：

```bash
sudo docker compose logs -f gzctf
```

看数据库状态：

```bash
sudo docker compose logs -f db
```

看 Redis 状态：

```bash
sudo docker compose logs -f cache
```

如果访问不到平台：

- 检查 `sudo docker compose ps`
- 检查服务器安全组和 `ufw`
- 检查 `GZCTF_PUBLIC_ENTRY`
- 检查 80 端口是否被占用：`sudo ss -lntp | grep ':80'`
- 如果 `80` 端口已被 Nginx、Apache 或其他服务占用，请先停止占用服务，或把 `.env` 中的 `GZCTF_WEB_PORT` 改为其他端口
