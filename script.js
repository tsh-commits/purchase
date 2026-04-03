// URL APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynAANfU1yTThgAUhd7uXX0ya0LmgqV3CJ3RUFn9edxVrTRVcrxdnvVMpb8zVc_aD2sAQ/exec"; 

let globalData = []; 

window.onload = function() {
    const otherInput = document.getElementById('otherVendorInput');
    if(otherInput) { otherInput.style.display = 'none'; }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabName === 'history') {
        loadData();
    }
}

function handleVendorChange() {
    const select = document.getElementById('vendorSelect');
    const otherInput = document.getElementById('otherVendorInput');
    
    if (select.value === 'その他') {
        otherInput.style.display = 'block'; 
        otherInput.classList.add('show');
        otherInput.required = true;
        otherInput.focus();
    } else {
        otherInput.classList.remove('show');
        otherInput.required = false;
        otherInput.value = ''; 
        setTimeout(() => { if(select.value !== 'その他') otherInput.style.display = 'none'; }, 300);
    }
}

async function submitData(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const status = document.getElementById('formStatus');
    const select = document.getElementById('vendorSelect');
    const otherInput = document.getElementById('otherVendorInput');
    
    btn.disabled = true;
    btn.innerHTML = "<span class='icon'>⏳</span> 送信中...";
    status.innerHTML = ""; 
    
    let finalVendorValue = select.value;
    if (finalVendorValue === 'その他') {
        finalVendorValue = otherInput.value.trim();
        if (!finalVendorValue) {
            status.innerHTML = "<span style='color:red;'>❌ 購入先を入力してください</span>";
            btn.disabled = false;
            btn.innerHTML = "<span class='icon'>📩</span> 依頼データを送信";
            otherInput.focus();
            return;
        }
    }

    const formData = new URLSearchParams();
    formData.append('action', 'insert');
    formData.append('reqDate', document.getElementById('reqDate').value);
    formData.append('maker', document.getElementById('maker').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('vendor', finalVendorValue); 
    formData.append('code', document.getElementById('code').value);
    formData.append('itemName', document.getElementById('itemName').value);
    formData.append('qty', document.getElementById('qty').value);
    formData.append('unit', document.getElementById('unit').value);
    formData.append('pic', document.getElementById('pic').value);

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        
        status.innerHTML = "<span style='color:var(--success-color);'>✅ 送信成功</span>";
        document.getElementById('purchaseForm').reset();
        otherInput.style.display = 'none'; 
        
        alert("購入依頼を送信しました。");
        
    } catch (error) {
        console.error(error);
        status.innerHTML = "<span style='color:red;'>❌ 送信失敗 (ネットワークエラー)</span>";
    }
    
    btn.disabled = false;
    btn.innerHTML = "<span class='icon'>📩</span> 依頼データを送信";
    setTimeout(() => { if(status.innerHTML.includes('成功')) status.innerHTML = ""; }, 4000);
}

// ========================================
// LOGIKA PEMUATAN, DASHBOARD & PENCARIAN
// ========================================
async function loadData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px;'>🔄 データを読み込んでいます...</td></tr>";
    
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        // Simpan data asli, hapus header row (baris pertama) jika ada
        globalData = data.filter(item => item['ID'] !== 'ID' && item['ID'] !== ''); 
        
        updateDashboard(globalData);
        renderTable(globalData); // Render semua data
        
    } catch (error) {
        console.error(error);
        tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px; color:red;'>❌ データの読み込みに失敗しました。</td></tr>";
    }
}

// Fitur 1: Pencarian Lokal (Sangat Cepat)
function filterData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredData = globalData.filter(item => {
        // Cek apakah ada teks yang cocok di kolom-kolom ini
        const searchText = (
            item['メーカー'] + " " + 
            item['品名'] + " " + 
            item['型式'] + " " + 
            item['担当者']
        ).toLowerCase();
        
        return searchText.includes(keyword);
    });

    renderTable(filteredData);
}

// Fungsi Render Tabel Terpisah
function renderTable(dataArray) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "";
    
    if (dataArray.length === 0) {
        tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px;'>データが見つかりません。</td></tr>";
        return;
    }

    // Looping data (terbaru di atas)
    for (let i = dataArray.length - 1; i >= 0; i--) {
        const item = dataArray[i];
        const isDone = item['ステータス'] === '済み';
        const statusClass = isDone ? 'status-zumi' : 'status-mi';
        
        let actionHtml = `<button class="btn-secondary btn-action" onclick="printSingle('${item['ID']}')">🖨️ 印刷</button>`;
        if (!isDone) {
            actionHtml += `<button class="btn-print btn-action" onclick="markAsDone('${item['ID']}')">✔️ 納品</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td class="col-id">${String(item['ID']).substring(String(item['ID']).length - 6)}</td>
                <td>${formatDateJP(item['購入依頼日'])}</td>
                <td>${item['メーカー'] || '-'}</td>
                <td>${item['型式'] || '-'}</td>
                <td>${item['品名'] || '-'}</td>
                <td>${item['数量']} ${item['単位']}</td>
                <td>${item['担当者']}</td>
                <td><span class="${statusClass}">${item['ステータス'] || '未'}</span></td>
                <td>${actionHtml}</td>
            </tr>
        `;
    }
}

// Fitur 4: Kalkulasi Dashboard
function updateDashboard(dataArray) {
    let total = dataArray.length;
    let pending = 0;
    let completed = 0;

    dataArray.forEach(item => {
        if (item['ステータス'] === '済み') {
            completed++;
        } else {
            pending++;
        }
    });

    document.getElementById('dash-total').innerText = total;
    document.getElementById('dash-pending').innerText = pending;
    document.getElementById('dash-completed').innerText = completed;
}

async function markAsDone(id) {
    if(!confirm("このアイテムを納品済みにしますか？\n(ステータス：未 -> 済み)")) return;
    
    const formData = new URLSearchParams();
    formData.append('action', 'update_status');
    formData.append('id', id);

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        alert("✅ ステータスを「済み」に更新しました。");
        document.getElementById('searchInput').value = ""; // Reset search
        loadData(); 
    } catch (error) {
        console.error(error);
        alert("❌ ステータスの更新に失敗しました。");
    }
}

function formatDateJP(dateString) {
    if(!dateString) return "";
    const d = new Date(dateString);
    if(isNaN(d)) return dateString; 
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function combineNameModel(name, model) {
    if(!model) return name;
    return `${name}<br><span style="font-size:9px; color:#666;">(${model})</span>`;
}

// =========================================
// ELEGAN PRINT LOGIC (A4 PORTRAIT) 
// =========================================
function printSingle(id) {
    const item = globalData.find(x => x['ID'] === id);
    if(!item) { alert("データが見つかりません。"); return; }
    
    document.getElementById('print-date').innerText = new Date().toLocaleDateString('ja-JP');
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = `
        <tr>
            <td style="text-align:center;">${formatDateJP(item['購入依頼日'])}</td>
            <td>${item['メーカー']}</td>
            <td>${combineNameModel(item['品名'], item['型式'])}</td>
            <td>${item['購入先']}</td>
            <td style="text-align:center;">${item['数量']} ${item['単位']}</td>
            <td>${item['担当者']}</td>
            <td style="text-align:center;">${item['ステータス'] || '未'}</td>
        </tr>
    `;
    window.print();
}

function printMonthly() {
    if(globalData.length === 0) { alert("印刷するデータがありません。"); return; }
    if(!confirm("月次レポートを印刷しますか？\n(最新の30件が出力されます)")) return;

    document.getElementById('print-date').innerText = new Date().toLocaleDateString('ja-JP');
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = "";
    
    const printData = globalData.slice(-30).reverse();
    
    printData.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td style="text-align:center;">${formatDateJP(item['購入依頼日'])}</td>
                <td>${item['メーカー']}</td>
                <td>${combineNameModel(item['品名'], item['型式'])}</td>
                <td>${item['購入先']}</td>
                <td style="text-align:center;">${item['数量']} ${item['単位']}</td>
                <td>${item['担当者']}</td>
                <td style="text-align:center;">${item['ステータス'] || '未'}</td>
            </tr>
        `;
    });
    window.print();
}
