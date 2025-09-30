const IMG_BASE = "{{ url_for('static', filename='images') }}"; // Sửa lại đường dẫn ảnh

// Định nghĩa danh sách các pool (mở rộng thêm các cặp pool mới)
const POOLS = [
  { pair: "ZEN/USDT", address: "0xZENUSDT...abc", icons: [`${IMG_BASE}/zen.svg`, `${IMG_BASE}/usdt.svg`], tags: ["1.0%", "0.5%", "Boosted"], tvl: 4700000, vol24h: 0, fees24h: 0, debtRatioPct: 0.000086, aprPct: 0.00 },
  { pair: "ZEN/USDC", address: "0xZENUSDC...def", icons: [`${IMG_BASE}/zen.svg`, `${IMG_BASE}/usdc.svg`], tags: ["1.0%", "0.5%", "Boosted"], tvl: 4100000, vol24h: 0, fees24h: 0, debtRatioPct: 0.38, aprPct: 0.00 },
  { pair: "USDT/USDC", address: "0xUSDTUSDC...123", icons: [`${IMG_BASE}/usdt.svg`, `${IMG_BASE}/usdc.svg`], tags: ["0.01%", "Stable"], tvl: 1500000, vol24h: 0, fees24h: 0, debtRatioPct: 1.38, aprPct: 0.00 },
  { pair: "ZEN/USDT (v2)", address: "0xZENUSDTv2...777", icons: [`${IMG_BASE}/zen.svg`, `${IMG_BASE}/usdt.svg`], tags: ["0.3%", "Boosted"], tvl: 1300000, vol24h: 0, fees24h: 0, debtRatioPct: 0.21, aprPct: 0.00 },
  { pair: "ZEN/USDC (v2)", address: "0xZENUSDCv2...999", icons: [`${IMG_BASE}/zen.svg`, `${IMG_BASE}/usdc.svg`], tags: ["0.05%", "Stable"], tvl: 1000000, vol24h: 0, fees24h: 0, debtRatioPct: 0.000035, aprPct: 0.00 },
  { pair: "BTC/USDT", address: "0xBTCUSDT...111", icons: [`${IMG_BASE}/btc.svg`, `${IMG_BASE}/usdt.svg`], tags: ["0.5%", "Stable"], tvl: 3000000, vol24h: 0, fees24h: 0, debtRatioPct: 0.10, aprPct: 0.01 },
  { pair: "ETH/USDT", address: "0xETHUSDT...222", icons: [`${IMG_BASE}/eth.svg`, `${IMG_BASE}/usdt.svg`], tags: ["0.8%", "Boosted"], tvl: 2500000, vol24h: 0, fees24h: 0, debtRatioPct: 0.50, aprPct: 0.02 },
  { pair: "ZEN/BTC", address: "0xZENBTC...333", icons: [`${IMG_BASE}/zen.svg`, `${IMG_BASE}/btc.svg`], tags: ["1.0%", "Boosted"], tvl: 2000000, vol24h: 0, fees24h: 0, debtRatioPct: 0.0005, aprPct: 0.01 },
  { pair: "ETH/USDC", address: "0xETHUSDC...444", icons: [`${IMG_BASE}/eth.svg`, `${IMG_BASE}/usdc.svg`], tags: ["0.7%", "Stable"], tvl: 1800000, vol24h: 0, fees24h: 0, debtRatioPct: 0.20, aprPct: 0.02 },
  { pair: "ZEN/USDT (v3)", address: "0xZENUSDTv3...555", icons: [`${IMG_BASE}/zen.svg`, `${IMG_BASE}/usdt.svg`], tags: ["0.6%", "Boosted"], tvl: 1200000, vol24h: 0, fees24h: 0, debtRatioPct: 0.15, aprPct: 0.03 },
  { pair: "USDT/ETH", address: "0xUSDTETH...666", icons: [`${IMG_BASE}/usdt.svg`, `${IMG_BASE}/eth.svg`], tags: ["0.05%", "Stable"], tvl: 1000000, vol24h: 0, fees24h: 0, debtRatioPct: 0.25, aprPct: 0.02 }
];

// Hàm định dạng USD
const fmtUSD = n => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtUSD2 = n => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = n => `${(+n).toLocaleString(undefined, { maximumFractionDigits: 6 })}%`;

const rowsEl = document.getElementById('rows');
let sortAsc = true;
let current = [...POOLS];

// Hàm tạo thẻ img với fallback
function imgTag(src, fallbackText) {
  return `
    <img src="${src}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/>
    <div class="fallback" style="display:none">${fallbackText}</div>
  `;
}

// Hàm render lại bảng
// Hàm render lại bảng
function render(list) {
  rowsEl.innerHTML = list.map(p => `
    <div class="row" onclick="showPoolDetails('${p.pair}', ${p.tvl}, ${p.aprPct})" style="text-decoration: none; color: inherit;">
      <div class="asset">
        <div class="icons">
          ${imgTag(p.icons[0], p.pair.split('/')[0].slice(0, 2).toUpperCase())}
          ${imgTag(p.icons[1], (p.pair.split('/')[1] || 'Z').slice(0, 2).toUpperCase())}
        </div>
        <div class="pair">
          <div class="name">${p.pair} <span class="muted" style="font-weight:400;">• ${p.address}</span></div>
          <div class="badges">
            ${p.tags.map(t => `<span class="badge ${/boost/i.test(t) ? 'boost' : 'tier'}">${t}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="num">${fmtUSD(p.tvl)}</div>
      <div class="num">${fmtUSD2(p.vol24h)}</div>
      <div class="num">${fmtPct(p.debtRatioPct)}</div>
      <div class="num">${fmtUSD2(p.fees24h)}</div>
      <div class="num">${(+p.aprPct).toFixed(2)}%</div>
    </div>
  `).join('');
}

// Gọi hàm render lần đầu tiên
render(current);

// Xử lý sự kiện tìm kiếm
const search = document.getElementById('search');
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  current = POOLS.filter(p =>
    p.pair.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q)
  );
  current.sort((a, b) => sortAsc ? a.tvl - b.tvl : b.tvl - a.tvl);
  render(current);
});

// Sắp xếp theo TVL
const sortBtn = document.getElementById('sortTvl');
const arrow = document.getElementById('arrowTvl');
sortBtn.addEventListener('click', () => {
  sortAsc = !sortAsc;
  arrow.textContent = sortAsc ? '↑' : '↓';
  current.sort((a, b) => sortAsc ? a.tvl - b.tvl : b.tvl - a.tvl);
  render(current);
});

// Xử lý sự kiện "Create Pool"
document.getElementById('createPoolBtn').addEventListener('click', () => {
  const poolData = {
    pair: "ZEN/USDT", 
    tvl: 4700000, 
    vol24h: 0,
    fees24h: 0,
    debtRatioPct: 0.000086,
    aprPct: 0.00
  };

  POOLS.push(poolData);
  render(POOLS);

  alert("Pool created successfully!");
});

// Hàm xử lý deposit cho mỗi pool
function deposit(pair, index) {
  // Lấy số tiền từ ô input của pool
  const depositAmount = document.getElementById(`depositAmount${index}`).value;

  if (!depositAmount || depositAmount <= 0) {
    alert("Please enter a valid deposit amount.");
    return;
  }

  // Tìm pool tương ứng với pair
  const pool = POOLS.find(p => p.pair === pair);
  if (pool) {
    // Xử lý logic deposit (cập nhật TVL, thông báo thành công)
    alert(`Deposited ${depositAmount} into ${pair}.`);
    // Nếu cần thiết, bạn có thể update TVL của pool ở đây.
  } else {
    alert("Pool not found.");
  }
}

let poolData = {};  // To store pool information

// Show Pool Details Modal
function showPoolDetails(pair, tvl, apr) {
  document.getElementById("poolName").innerText = pair;
  poolData = { pair, tvl, apr };
  document.getElementById("poolDetailsModal").style.display = "flex";  // Display as flex for centering
}

// Close Modal
function closeModal() {
  document.getElementById("poolDetailsModal").style.display = "none";
}

// Update USDT when ZEN is entered
function updateUSDT() {
  const zenAmount = document.getElementById("depositZenAmount").value;
  const usdtAmount = (zenAmount * poolData.apr).toFixed(2);  // Just a simple calculation
  document.getElementById("depositUSDTAmount").value = usdtAmount;
}

// Update ZEN when USDT is entered
function updateZEN() {
  const usdtAmount = document.getElementById("depositUSDTAmount").value;
  const zenAmount = (usdtAmount / poolData.apr).toFixed(2);  // Reverse calculation
  document.getElementById("depositZenAmount").value = zenAmount;
}

// Submit Deposit
function submitDeposit() {
  const zenAmount = document.getElementById("depositZenAmount").value;
  const usdtAmount = document.getElementById("depositUSDTAmount").value;
  if (zenAmount <= 0 && usdtAmount <= 0) {
    alert("Please enter a valid deposit amount.");
    return;
  }

  alert(`Deposited ${zenAmount} ZEN and ${usdtAmount} USDT into ${poolData.pair}`);
  closeModal();
}