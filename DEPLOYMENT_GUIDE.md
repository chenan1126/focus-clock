# 🚀 專注時鐘部署指南

## 部署到 031126.xyz

### 方法 1: Vercel 部署 (推薦)

#### 步驟 1: 準備 Git 倉庫
```bash
# 初始化 Git (如果還沒有)
git init
git add .
git commit -m "Initial commit: Focus Clock app ready for deployment"

# 推送到 GitHub
git remote add origin https://github.com/your-username/focus-clock.git
git push -u origin main
```

#### 步驟 2: Vercel 部署
1. 前往 [Vercel.com](https://vercel.com)
2. 使用 GitHub 帳戶登入
3. 點擊 "New Project"
4. 選擇您的 focus-clock 倉庫
5. 部署設定：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 點擊 "Deploy"

#### 步驟 3: 設定自訂網域
1. 在 Vercel 項目設定中點擊 "Domains"
2. 添加 `031126.xyz` 和 `www.031126.xyz`
3. 按照指示設定 DNS 記錄：

**DNS 設定 (在您的域名註冊商):**
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### 方法 2: Netlify 部署

#### 步驟 1: 直接拖拽部署
1. 前往 [Netlify.com](https://netlify.com)
2. 將 `dist` 資料夾直接拖拽到部署區域
3. 或連接 GitHub 倉庫自動部署

#### 步驟 2: 自訂網域設定
1. 在 Netlify 項目中點擊 "Domain settings"
2. 添加自訂網域 `031126.xyz`
3. 設定 DNS：

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www  
Value: your-site-name.netlify.app
```

### 方法 3: GitHub Pages + 自訂網域

#### 步驟 1: 建立 GitHub Actions
創建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
        cname: 031126.xyz
```

#### 步驟 2: 啟用 GitHub Pages
1. 在 GitHub 倉庫設定中啟用 Pages
2. 選擇 "gh-pages" 分支
3. 在域名註冊商設定 DNS：

```
Type: A
Name: @
Value: 185.199.108.153

Type: A  
Name: @
Value: 185.199.109.153

Type: CNAME
Name: www
Value: your-username.github.io
```

## 🔧 部署前檢查清單

### 1. 更新網站 URL
在以下文件中將 URL 更新為 `https://031126.xyz`:

**index.html**:
```html
<meta property="og:url" content="https://031126.xyz" />
```

**main.js** (如果有 canonical URL):
```javascript
// 更新任何硬編碼的 URL
```

### 2. Google Analytics 設定
```html
<!-- 替換為真實的 GA 測量 ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. AdSense 準備
部署完成後，等待 24-48 小時讓網站穩定，然後：
1. 申請 Google AdSense
2. 添加網站到 AdSense
3. 替換廣告代碼中的發布商 ID

## 📊 部署後檢查

### SSL 證書
- ✅ 確保 HTTPS 正常運作
- ✅ HTTP 自動重定向到 HTTPS

### 效能檢查
- ✅ Google PageSpeed Insights 測試
- ✅ 載入時間 < 3 秒
- ✅ 手機版適配正常

### SEO 檢查  
- ✅ Google Search Console 設定
- ✅ Sitemap 提交
- ✅ robots.txt 檢查

## 🎯 AdSense 申請時機

**最佳申請時機:**
1. 網站上線 1-2 週
2. 有一定的自然流量 (每日 50+ 訪問)
3. 內容豐富且原創
4. 所有政策頁面完整

**預期審核時間:** 1-14 天

---

選擇一種部署方法，我可以協助您完成具體的設定步驟！
