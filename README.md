# TeamTaiwan 「聽台灣」 - 智慧會議轉錄系統 🎤✨

「聽台灣」是一款專為台灣在地語音打造的 AI 智慧轉錄系統。結合 Google Gemini 3 Flash 模型，提供精準的語音轉文字、講者辨識以及會議摘要功能。

![Aesthetics](https://img.shields.io/badge/UI-Premium-emerald) ![Tech](https://img.shields.io/badge/Backend-Node.js-blue) ![Tech](https://img.shields.io/badge/Frontend-React-cyan) ![Tech](https://img.shields.io/badge/AI-Gemini_Flash-purple)

---

## 🌟 核心特色

- **在地語音優化**：特別針對台灣口音、中英夾雜以及台語進行優化處理。
- **隱私至上 (Privacy First)**：API Key 僅儲存於您的瀏覽器中，語音資料處理均在用戶端完成，不經過任何中轉伺服器。
- **自動講者辨識**：自動區分不同發言者，並標註精確時間軸。
- **智慧格式優化**：同時提供「原始逐字稿」與「語意修正後內容」，讓紀錄更易讀。
- **一鍵生成摘要**：快速生成會議重點，支援繁體中文輸出。

---

## 🌟 示範網站
- Invitation Code: ai4all

- Url: http://teamtaiwan.biobank.org.tw/

---

## 🚀 快速安裝 (Docker 部署)

本系統要求必須在 **HTTPS** 環境下執行（以獲取麥克風權限）。我們提供了一鍵啟動腳本，會自動為您處理 SSL 憑證。

### 方法一：使用一鍵啟動腳本 (Linux / Mac / NAS)
這是最推薦的方法，會自動檢查環境並產生必要的自簽憑證：

```bash
# 1. 賦予腳本執行權限
chmod +x setup.sh

# 2. 執行啟動腳本
./setup.sh
```

### 方法二：手動部署 (Windows / PowerShell)
1. **準備憑證**：在專案根目錄建立 `ssl` 資料夾，並確有 `fullchain.pem` 與 `privkey.pem`。
   > 若無憑證，可執行：`openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/privkey.pem -out ssl/fullchain.pem -subj "/CN=localhost"`
2. **啟動容器**：
   ```bash
   docker-compose up -d --build
   ```

---

## 📖 操作說明

### 1. 初始設定
- 部署成功後，瀏覽 `https://您的伺服器IP`。
- 系統會要求輸入 **Gemini API Key**。請前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 免費獲取。
- 選取「記住我的金鑰」可將金鑰安全地儲存於瀏覽器的 LocalStorage 中。

### 2. 開始轉錄
- **即時錄音**：點擊「Record」面板進行會議內容錄製。
- **上傳檔案**：點擊「Upload」面板上傳現有的音檔（支援 mp3, wav, m4a 等）。
- 錄音完畢後點擊「Start Transcription」，系統將自動進行分段處理。

### 3. 檢視與匯出
- **處理中**：系統會即時顯示已完成的語音片段，您可以即時閱讀。
- **匯出**：轉錄完成後，提供「原始 JSON」與「精簡逐字稿」下載。
- **歷史紀錄**：左側側邊欄會保留您所有的轉錄紀錄（儲存於瀏覽器 IndexDB 中）。

---

## 🔧 技術架構

- **Frontend**: React 19 + TailwindCSS + Lucide Icons
- **Backend**: Node.js 22 (Fastify/Express)
- **Proxy**: Nginx (Alpine) + SSL Termination
- **Database**: IndexedDB (瀏覽器端存儲大型音檔)
- **AI Engine**: Google Gemini 3 Flash Preview

---

## ❓ 常見問題 (FAQ)

**Q: 瀏覽器顯示「連線不安全」？**
A: 因為系統預設使用「自簽憑證」來滿足 HTTPS 要求。請點擊「進階」並點擊「繼續前往 (不安全)」即可。

**Q: 錄音按鈕無法點選？**
A: 確保您是透過 `https://` 訪問。若為 `http://` 訪問，瀏覽器會依據安全規範停用錄音 API。

**Q: 檔案上傳有限制嗎？**
A: 預設 Nginx 限制為 100MB。如需上傳超大型檔案，請修改 `nginx.conf` 中的 `client_max_body_size` 設定。

---

## 🛡️ 數據與隱私說明

「聽台灣」致力於保護您的隱私：
1. **API Key**：加密存儲於瀏覽器 LocalStorage。
2. **音檔數據**：儲存於您本地瀏覽器的 IndexedDB。
3. **通訊鏈路**：您的瀏覽器 ↔️ Google Gemini API (直接通訊，不經由本專案伺服器轉發)。

---

## 🤝 維護與支援
本專案由 **[NCHC GenAI Team](https://www.nchc.org.tw/)** 提供支援與開發。

---

*如果您喜歡這個專案，歡迎給我們一個 Star！🌟*
