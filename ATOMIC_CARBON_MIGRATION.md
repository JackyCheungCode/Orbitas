# Atomic CRM → Orbitas / IBM Carbon 重构计划

## 目标

以官方 `marmelab/atomic-crm`（MIT）为 CRM 业务功能基础，重构为 Orbitas，并将 UI 迁移到 IBM Carbon Design System。产品定位为通用 B2B CRM，不包含制造、生产、工单或物料管理模块。

## 部署与安全约束

- 前端目标：React + TypeScript + Vite + `@carbon/react` + `@carbon/icons-react`。
- 托管目标：Cloudflare Pages；只有需要服务端执行的功能才使用 Cloudflare Workers。
- 数据与身份：保留现有 Supabase 项目，先审计 schema、Auth、Storage、Edge Functions、RLS 与组织隔离策略。
- 禁止将 Supabase service-role key 放进浏览器端。
- 不修改 `main`，不直接合并 PR，不切换 Cloudflare 正式部署分支。
- 不运行可能重置或删除远程 Supabase 数据的初始化/迁移命令。
- 保留 Atomic CRM 的 MIT LICENSE 和版权声明。

## 实施阶段

1. **获取上游源码并锁定版本**：从官方仓库导入完整 Git 历史或建立 fork，记录上游 commit SHA、LICENSE 与 package-lock。
2. **源码审计**：核对 React/TypeScript/Vite 版本、react-admin、Supabase provider、数据模型、迁移、认证、存储、邮件、API、测试与构建脚本。
3. **环境兼容性验证**：在隔离环境安装依赖，运行 typecheck、unit tests、production build；确认 Cloudflare Pages SPA 路由回退和环境变量。
4. **Carbon 设计系统迁移**：先建立 Carbon theme、Shell、Header、SideNav、Grid、DataTable、Form、Modal、Toast 与页面模板；逐页替换 shadcn/Radix/Tailwind 组件，不做一次性大爆改。
5. **CRM 功能迁移**：公司/客户、联系人、商机与销售管道、任务、活动记录、导入导出、搜索筛选、详情钻取、团队权限。
6. **Supabase 适配**：将上游 schema 与现有 schema 逐表对照；生成新迁移并审查 RLS，不直接重建生产数据库。
7. **验收**：CI build/typecheck/tests 通过；验证匿名访问、登录、组织隔离、viewer 权限、CRUD、刷新深链接和移动端布局。
8. **PR 与预览部署**：提交独立 PR；确认检查通过后再请求人工审查。未经明确批准不合并、不切换正式部署。

## 当前仓库状态

当前 Orbitas 的 `feat/carbon-foundation` 已包含 Carbon 依赖和自建 CRM 页面，但它不是官方 Atomic CRM 的完整源码树。必须先完成上游源码导入，才能称为“基于 Atomic CRM 重构”。本分支用于隔离迁移工作，不能视为已完成上游导入或部署验证。
