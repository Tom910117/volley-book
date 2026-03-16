// test-global-rate-limit.js

const url = "http://localhost:3000/api/games/join";
const totalRequests = 100;

async function sendRequest(index) {
  // 💡 核心技巧：動態生成 100 個不同的假 IP (例如 192.168.1.1 到 192.168.1.100)
  const mockIp = `192.168.1.${index + 1}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 偽裝 HTTP Header，讓 proxy.ts 以為這是來自不同使用者的請求
        "x-forwarded-for": mockIp,
      },
      body: JSON.stringify({
        gameId: "test-game-id-123",
        needsWaitlist: false
      })
    });

    return { index, ip: mockIp, status: response.status };
  } catch (error) {
    return { index, ip: mockIp, status: "Error", message: error.message };
  }
}

async function runTest() {
  console.log(`🚀 開始發送 ${totalRequests} 個「不同 IP」的併發請求到 ${url}...`);
  const startTime = Date.now();

  // 創造 100 個 Promise 同時射向後端
  const promises = Array.from({ length: totalRequests }).map((_, i) => sendRequest(i));
  const results = await Promise.all(promises);

  const endTime = Date.now();

  // 統計各種 HTTP 狀態碼出現的次數
  const statusCounts = results.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n✅ 測試完成！總耗時: ${endTime - startTime} 毫秒`);
  console.log("📊 狀態碼統計結果:");
  
  for (const [status, count] of Object.entries(statusCounts)) {
    if (status === "429") {
      console.log(`   🔴 429 (成功被 L2 全域限流擋在門外): ${count} 次`);
    } else if (status === "401") {
      console.log(`   🟡 401 (穿透 L2，進入後端 route.ts 被 Auth 擋下): ${count} 次`);
    } else {
      console.log(`   ⚪ ${status}: ${count} 次`);
    }
  }
}

runTest();