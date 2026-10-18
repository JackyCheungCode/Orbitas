# Atomic CRM 源码与 Orbitas 兼容性审计

审计日期：2026-10-18

## 上游来源

- 仓库：`https://github.com/marmelab/atomic-crm`
- 当前上游分支：`main`
- 审计文件：`package.json`、`src/App.tsx`、`vite.config.ts`、`supabase/config.toml`、`supabase/schemas/01_tables.sql`、`LICENSE.md`
- 许可证：MIT；衍生版本必须保留原版权声明和许可证文本。

## 结论摘要

**Atomic CRM 可作为功能和代码基线，但不是直接复制进现有 Orbitas 分支就能运行。** 需要先完整导入上游源码，之后在独立分支上迁移 Carbon UI，并设计兼容现有多租户数据模型的数据库迁移。

### 上游技术栈（当前审计到的版本范围）

- React 19、TypeScript、Vite 8
- React Router 7
- react-admin headless core（`ra-core`）、TanStack Query、React Hook Form
- shadcn/Radix、Tailwind CSS v4
- Supabase：PostgreSQL、Auth、REST API、Storage、Edge Functions
- Vitest 与 Playwright 测试

### Orbitas 当前技术栈

- React 18、TypeScript、Vite 6
- React Router DOM 6
- `@carbon/react` 与 `@carbon/icons-react` 已加入依赖
- Supabase JS 2.57.x
- 已有 organization-scoped 的 companies、contacts、activities、data_sources 等 schema，包含组织成员角色和 RLS

## 重要兼容性风险

1. **React/Vite 主版本差异**：Atomic CRM 当前依赖 React 19、Vite 8，而 Orbitas 目前是 React 18、Vite 6。不要直接合并两个 package.json；先确定统一版本，安装后运行 typecheck/build/tests。
2. **路由版本差异**：上游使用 React Router 7，Orbitas 使用 React Router DOM 6。需要选择升级路由或做适配，不可假定 API 完全兼容。
3. **UI 迁移范围**：上游主界面入口为 `src/App.tsx`，根 CRM 组件位于 `src/components/atomic-crm/root/CRM`。界面不仅是 CSS；组件库、表单、菜单、数据表、模态框和布局均需要逐步替换为 Carbon。
4. **数据库模型不兼容**：Atomic CRM 使用 bigint identity ID，销售用户通过 `sales` 表关联 `auth.users`；Orbitas 使用 UUID，并依赖 `organizations` / `organization_members` 进行多租户隔离。不能把上游的 `supabase/schemas` 或迁移直接应用到现有远程项目。
5. **CRM 功能差异**：上游包含 companies、contacts、deals、contact/deal notes、sales、tags、tasks、configuration 等表。Orbitas 当前缺少 deals、notes、tags 等完整业务表；需要制定新的 organization-scoped schema 及 RLS。
6. **本地开发依赖**：上游 README 的完整本地开发流程使用 Make、Node 22 LTS 和 Docker/Supabase CLI。前端产物为 SPA，可部署到 CDN；Cloudflare Pages 兼容性仍需 CI build 与路由验证，不能仅凭架构推断已成功部署。
7. **邮件与附件**：上游包含入站邮件/Postmark、Supabase Storage 等可选功能。它们需要单独配置 secrets、bucket policies 与 webhook；首期 Carbon UI 迁移不应默认启用这些生产集成。
8. **环境变量**：核对上游使用的 `VITE_SB_PUBLISHABLE_KEY` 与 Orbitas 当前 `VITE_SUPABASE_PUBLISHABLE_KEY` 命名差异；统一配置前不要覆盖 Cloudflare Pages 环境变量。

## 建议实施顺序

1. 获取上游完整 Git 源码及 LICENSE，并记录上游 commit SHA。
2. 在独立工作分支安装依赖，跑上游 typecheck/build/tests，建立基线结果。
3. 确认 React/Router/Vite 版本策略。
4. 建立 Carbon 设计系统基础层，先迁移 Shell、导航、列表、详情、表单和对话框。
5. 建立 Orbitas 多租户 CRM schema 迁移：deals、notes、tasks、tags、sales/team mapping，并为每张表配置 organization_id 与 RLS。
6. 用假数据验证 UI；通过后再连 Orbitas Supabase 项目。
7. 在隔离 Supabase 分支/本地数据库验证迁移；绝不对现有项目直接运行上游 reset/init/migration。
8. 在 Cloudflare Pages 预览部署并验证登录、深链接、组织隔离、CRUD 和移动端布局。

## 安全与分支约束

- 不修改 `main`，不自动合并 PR。
- 不修改旧的 `orbitas` Pages 项目或旧 Worker。
- 不将 service-role key 放入客户端代码。
- 不对现有 Supabase 项目执行 destructive migration、reset 或上游初始化。
- 保留 MIT LICENSE 与上游版权信息。

## 当前完成情况

这是基于上游可读取源码和 Orbitas 当前分支文件的静态兼容性审计。尚未完成上游全量源码导入、依赖安装、自动化测试或 Cloudflare 预览验证；不应把这些事项标记为已完成。
