# TeamTaiwan 「聽台灣」安裝與啟動教學 (INSTALL.md)

這份文件將引導您如何在自己的機器（本地伺服器、NAS 或雲端主機）上，使用 Docker 快速部署具備 SSL 安全憑證的「聽台灣」智慧會議轉錄系統。

---

## 1. 環境需求
在開始之前，請確保您的機器已安裝以下軟體：
- **Docker**
- **Docker Compose**

## 2. 檔案目錄結構
請確保您的專案目錄包含以下必要檔案：
```text
/echo (專案根目錄)
├── Dockerfile           # 程式打包設定
├── docker-compose.yml   # 容器編排設定
├── nginx.conf           # SSL 與反向代理設定
├── ssl/                 # 憑證目錄
│   ├── fullchain.pem    # SSL 憑證金鑰 (公鑰)
│   └── privkey.pem      # SSL 憑證金鑰 (私鑰)
├── server/              # 後端與靜態檔案目錄
└── (其他程式原始碼)
```

## 3. 安裝與啟動步驟

### 第一步：準備 SSL 憑證
錄音功能（Web Audio API）要求必須在 `localhost` 或 `HTTPS` 環境下才能運作。如果您是在內網 IP 或域名部署，必須準備 SSL 憑證。

#### 選項 A：使用已有的憑證 (建議)
1. 在專案目錄下建立 `ssl` 資料夾。
2. 將您的憑證檔案更名為 `fullchain.pem` (公鑰) 與 `privkey.pem` (私鑰) 並放入該資料夾。

#### 選項 B：產生自簽憑證 (僅限測試使用)
如果您沒有憑證，可以使用以下指令快速產生一組（需要安裝 OpenSSL）：
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=NCHC/OU=GenAI/CN=localhost"
```

### 第二步：安裝與啟動

您可以選擇**自動腳本**（建議）或**手動步驟**：

#### 選項 A：使用一鍵啟動腳本 (Linux / Mac)
在終端機執行以下指令，系統會自動檢查憑證、產生自簽憑證（若缺失）並啟動 Docker：
```bash
chmod +x setup.sh
./setup.sh
```

#### 選項 B：手動啟動 (Windows / 其他)
如果您是在 Windows 環境或想手動操作，請執行以下步驟：
1. **產生憑證**：確認 `ssl/` 資料夾內有 `fullchain.pem` 與 `privkey.pem`。若無憑證，請執行：
   ```bash
   mkdir ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/privkey.pem -out ssl/fullchain.pem -subj "/CN=localhost"
   ```
2. **啟動容器**：
   ```bash
   docker-compose up -d --build
   ```

這個指令會自動：
1. **builder 階段**：下載 Node.js 22 環境，編譯 React 檔案。
2. **echoscript 階段**：啟動 Node.js 伺服器，負責靜態檔案與 API 代理。
3. **nginx 階段**：啟動 Nginx 處理 HTTPS 流量（443 埠）。

### 第三步：訪問服務
開啟瀏覽器，輸入您的機器 IP 或域名：
- **網址**：`https://您的伺服器IP`
- **備註**：如果您使用的是自簽憑證，瀏覽器會顯示「您的連線並非不安全」，請點選「進階」並選擇「繼續前往 (不安全)」。

---

## 4. 使用說明
1. **進入介面**：開啟網頁後，系統會要求您輸入 **Gemini API Key**。
2. **輸入金鑰**：請前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 獲取免費或付費的 API Key。
3. **資料隱私**：輸入的金鑰將僅儲存在「您瀏覽器的 LocalStorage」中，系統會直接從瀏覽器與 Google 進行通訊。伺服器僅作為網頁載體。

---

## 5. 常見問題 (Troubleshooting)

### Q: 錄音按鈕按了沒反應？
- **檢查 HTTPS**：麥克風權限僅在 HTTPS 模式下開放。
- **檢查瀏覽器權限**：請確認您是否已允許瀏覽器存取麥克風。

### Q: 如何更新程式碼？
```bash
git pull                   # 從倉庫拉取最新程式碼
docker-compose down       # 停止舊容器
docker-compose up -d --build # 重新構建並啟動
```

### Q: 檔案上傳限制？
預設 Nginx 限制上傳大小為 100M。如需調整，請修改 `nginx.conf` 中的 `client_max_body_size` 設定，並重啟 Nginx 容器。

---

## 6. 維護紀錄
本專案已移除服務器端的 API Key 強制需求，改由前端輸入以確保隱私。相關技術細節請參考 `README.md`。
