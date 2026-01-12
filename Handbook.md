# TeamTaiwan「聽台灣」智慧會議轉錄 - 使用者手冊

歡迎使用 **TeamTaiwan「聽台灣」**！這是一款專為台灣使用者設計的現代化 AI 語音轉錄工具。我們利用 Google 最新 Gemini 3 Flash 模型，針對 **台灣華語 (Taiwanese Mandarin)** 與 **台語 (Taiwanese Hokkien)** 進行優化，能精準辨識在地口音、中英夾雜的對話，並一鍵生成結構化的會議紀錄與摘要。

本手冊將引導您了解如何使用本系統的所有功能。

---

## ✨ 核心特色

*   **在地化 AI 引擎**：精確辨識台灣口音、方言與專有名詞。
*   **雙重轉錄顯示**：同時提供「原始逐字稿 (含語助詞)」與「AI 潤飾稿 (語意通順版)」。
*   **自動摘要**：針對長篇會議內容自動生成繁體中文重點摘要。
*   **情緒與語者偵測**：自動區分發言者 (Speaker Diarization) 並偵測發言情緒。
*   **隱私優先 (Privacy First)**：採用 "Thick Client" 架構，音訊處理與 API 請求皆在瀏覽器端完成，不經手第三方伺服器。
*   **斷點續傳與重試**：支援網路不穩時的自動重試機制。

---

## Demo site

https://teamtaiwan.biobank.org.tw/

---

## 🚀 1. 系統登入與設定

為了確保系統資源與安全性，首次進入系統需進行驗證。

### 步驟
1.  **Invitation Code (邀請碼)**：
    *   請輸入系統預設邀請碼：**`ai4all`** (不分大小寫)。
2.  **Gemini API Key**：
    *   您需要一組 Google Gemini API Key。
    *   若無金鑰，請點擊介面上的 "Get key" 連結前往 Google AI Studio 申請。
    *   建議使用付費帳號以啟用更高階的 Gemini 3 模型與更高的傳輸限額。
3.  **保持登入 (Keep me logged in)**：
    *   勾選此選項後，系統會將您的 API Key 加密儲存於瀏覽器的 LocalStorage，下次開啟無需再次輸入。

![image](https://hackmd.io/_uploads/HkGSbeWSZe.png)
> 圖一: 系統登入畫面，使用者需輸入邀請碼與 Gemini API Key，並可選擇是否保持登入狀態。

---

## 🎙️ 2. 建立新任務 (上傳檔案)

登入後，您可以透過上傳音訊檔案來進行轉錄：

### 上傳檔案 (Upload File)
適合處理既有的錄音檔或影片檔。
1.  點擊上傳區域，或直接將檔案拖曳至框內。
2.  **支援格式**：MP3, WAV, M4A, WEBM, MP4。
3.  **大型檔案支援**：系統內建自動分割技術，可處理超過 1 小時的長錄音檔。

![image](https://hackmd.io/_uploads/HJgFWxWBZe.png)
> 圖二: 建立新任務的檔案上傳介面，支援拖曳或點擊上傳音訊與影片檔案。

---

## ⚡ 3. 生成轉錄 (Generate Transcript)

當音訊準備就緒後：

1.  點擊畫面下方的 **✨ Generate Transcript** 按鈕。
2.  **處理階段說明**：
    *   `Preprocessing`: 正在對音訊進行解碼、重取樣 (16kHz) 與切割。
    *   `Transcribing part X of Y`: 正在分段將音訊傳送至 Google Gemini 進行轉錄。
    *   `Analyzing`: 所有片段轉錄完成後，系統會進行全文分析以生成總結摘要。
3.  **處理中斷怎麼辦？**
    *   若網路中斷或處理失敗，歷程列表會顯示紅色錯誤狀態。
    *   點擊該任務，按一下 **Resume Transcription** 即可從中斷點嘗試恢復，無需重新上傳。

![image](https://hackmd.io/_uploads/Hyc2blWrWe.png)
> 圖三: 點擊「Generate Transcript」按鈕以開始音訊轉錄與分析流程。

![image](https://hackmd.io/_uploads/B1qlzebrbx.png)
> 圖四: 顯示音訊預處理、分段轉錄與全文分析等系統處理進度狀態。

---

## 📝 4. 檢視與閱讀結果

轉錄完成後，畫面將分為兩大區塊：

### 1. 重點摘要 (Summary)
*   位於頁面最上方。
*   AI 會自動歸納會議核心重點、待辦事項與結論。
*   若原文非英文，系統會強制輸出 **繁體中文** 摘要。
*   支援 Markdown 格式渲染，點擊右上角 "Copy" 可複製格式化文字。

![image](https://hackmd.io/_uploads/HyEUMx-S-x.png)
> 圖五: AI 自動產生的會議重點摘要，整理核心結論與重要事項。

### 2. 詳細逐字稿 (Detailed Transcript)
*   依據時間軸列出每段發言。
*   **Speaker**：自動標記發言者（如 Speaker 1, Alice 等）。
*   **Emotion**：顯示該段發言的情緒（開心 🙂、生氣 😠、悲傷 😢、中立 😐）。
*   **雙欄顯示**：
    *   **Original Transcript (左欄)**：完全忠實的逐字稿，包含贅字、結巴、台語發音直譯，適合查證原始語意。
    *   **Semantic Correction (右欄)**：AI 潤飾後的版本，修正語法錯誤、去除贅字，語句通順，適合閱讀與引用。

![image](https://hackmd.io/_uploads/rklpMeZH-x.png)
> 圖六:  依時間軸呈現的詳細逐字稿，包含發言者、情緒標記，以及原始與潤飾後的雙欄內容。

---

## 📤 5. 匯出與下載

在任務詳情頁面的右上角，提供三種下載選項：

1.  **🎵 Audio**
    *   下載原始錄音檔（格式通常為 WAV 或 WebM）。
    *   將瀏覽器資料庫中暫存的音訊檔案下載至電腦保存。

2.  **⬇️ Download Full Analysis**
    *   下載完整的 JSON 檔案。
    *   包含所有欄位：摘要、原始逐字稿、潤飾稿、時間戳記、情緒標籤與發言者資訊。
    *   適合開發者或需要完整資料存檔的使用者。

3.  **📄 Download Corrected Only**
    *   下載精簡版的 JSON 檔案。
    *   **移除**了原始逐字稿 (Original Transcript)，僅保留潤飾後的內容與摘要。
    *   適合直接用於報告生成或發布用途。

![image](https://hackmd.io/_uploads/SyDSmlZS-g.png)
> 圖七: 任務結果下載選項，提供完整分析資料與不同格式的匯出功能。

---

## 📂 6. 歷史紀錄管理

*   **自動儲存**：所有的轉錄結果與錄音檔皆會自動儲存於您的瀏覽器中 (LocalStorage + IndexedDB)。
*   **檢視歷史**：在「建立新任務」頁面的下方，會列出最近的歷史紀錄。
*   **刪除任務**：
    *   在歷史列表中，點擊垃圾桶圖示 🗑️ 即可刪除。
    *   **注意**：刪除後，相關的錄音檔與文字紀錄將從瀏覽器中永久移除，無法復原。

---

## 📱 7. 安裝應用程式 (PWA)

本系統支援 PWA (Progressive Web App)，可安裝於電腦或手機，享受如原生 App 的體驗（全螢幕、離線開啟）。

*   **電腦 (Chrome/Edge)**：
    *   點擊網址列右側的「安裝」圖示 📥 即可安裝至桌面。
*   **iOS (iPhone/iPad)**：
    1.  使用 Safari 瀏覽器開啟。
    2.  點擊下方的分享按鈕。
    3.  選擇「加入主畫面 (Add to Home Screen)」。
*   **Android**：
    *   依照瀏覽器提示點擊「安裝應用程式」或從選單中選擇「安裝」。

![image](https://hackmd.io/_uploads/S1Dh7lWrWe.png)
> 圖八: 將 TeamTaiwan 安裝為 PWA 應用程式，在桌面或行動裝置上以原生 App 方式使用。

---

## 🌗 8. 其他功能

*   **深色模式 (Dark Mode)**：點擊右上角的太陽/月亮圖示可切換介面風格。
*   **登出 (Logout)**：點擊右上角的登出圖示。登出會清除儲存於 LocalStorage 的 API Key，但**不會**刪除歷史紀錄與錄音檔。

---

*Document Version: 1.0 | Applicable Version: TeamTaiwan v0.1*

---

**Powered by [NCHC LLM Team](https://www.nchc.org.tw/)**
