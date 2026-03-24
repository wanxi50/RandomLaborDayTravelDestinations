import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// 读取统一文案配置
const textConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/data/text-config.json"), "utf-8"),
);
const ST = textConfig.server;

app.use(express.json());

// ============ 持久化存储 ============
const DATA_DIR = path.join(__dirname, "../data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { currentStep: "province", province: null, city: null, records: [] };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// 获取当前状态
app.get("/api/state", (req, res) => {
  res.json(readState());
});

// 更新当前状态（省/市选择、步骤切换）
app.put("/api/state", (req, res) => {
  const current = readState();
  const updated = { ...current, ...req.body };
  writeState(updated);
  res.json(updated);
});

// 添加一条抽奖记录
app.post("/api/records", (req, res) => {
  const state = readState();
  const record = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...req.body,
  };
  state.records.push(record);
  writeState(state);
  res.json(record);
});

// 获取所有抽奖记录
app.get("/api/records", (req, res) => {
  const state = readState();
  res.json(state.records);
});

// 重置状态（重新开始）
app.post("/api/reset", (req, res) => {
  const state = readState();
  const reset = {
    currentStep: "province",
    province: null,
    city: null,
    records: state.records,
  };
  writeState(reset);
  res.json(reset);
});

// 生产环境 serve 前端静态文件
app.use(express.static(path.join(__dirname, "../dist")));

// AI 生成目的地介绍（流式代理）
app.post("/api/generate", async (req, res) => {
  const { province, city } = req.body;

  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "claude-sonnet-4-6";

  if (!apiKey || !baseUrl) {
    return res.status(500).json({ error: ST.errorNoConfig });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: ST.systemPrompt },
          { role: "user", content: ST.userPrompt.replace("{province}", province).replace("{city}", city) },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API 错误:", response.status, errorText);
      return res.status(502).json({ error: ST.errorApiUnavailable });
    }

    // 透传 SSE 流
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (error) {
    console.error("AI 生成失败:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: ST.errorGenFailed });
    }
  }
});

// SPA 回退路由
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
});
