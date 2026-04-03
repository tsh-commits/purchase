// ==============================================================================
// ⚠️ PERINGATAN! JANGAN LUPA GANTI URL DI BAWAH INI DENGAN URL APPS SCRIPT ANDA
// ==============================================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynAANfU1yTThgAUhd7uXX0ya0LmgqV3CJ3RUFn9edxVrTRVcrxdnvVMpb8zVc_aD2sAQ/exec"; 

let globalData = []; // Penyimpan data lokal untuk print

// window.onload: Mematikan input 'sonota' saat awal load
window.onload = function() {
    const otherInput = document.getElementById('otherVendorInput');
    if(otherInput) { otherInput.style.display = 'none'; }
}

// ==============================
// LOGIKA TAB & RESPONSIVE DEVICE
// ==============================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabName === 'history') {
        loadData();
    }
}

// ==================================
// LOGIKA DROP DOWN K購入先 (Vendor)
// ==================================
function handleVendorChange() {
    const select = document.getElementById('vendorSelect');
    const otherInput = document.getElementById('otherVendorInput');
    
    if (select.value === 'その他') {
        otherInput.style.display = 'block'; // Langsung ubah display (lebih cepat di mobil)
        otherInput.classList.add('show');
        otherInput.required = true;
        otherInput.focus();
    } else {
        otherInput.classList.remove('show');
        otherInput.required = false;
        otherInput.value = ''; // Reset input manual
        // Gunakan timeout kecil untuk menyembunyikan display setelah animasi selesai
        setTimeout(() => { if(select.value !== 'その他') otherInput.style.display = 'none'; }, 300);
    }
}

// =========================================
// LOGIKA FORM SUBMISSION (Kirim ke Sheets)
// =========================================
async function submitData(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const status = document.getElementById('formStatus');
    const select = document.getElementById('vendorSelect');
    const otherInput = document.getElementById('otherVendorInput');
    
    btn.disabled = true;
    btn.innerHTML = "<span class='icon'>⏳</span> 送信中...";
    status.innerHTML = ""; // Clear previous status
    
    // Tentukan Nilai 購入先 Akhir (Jika sonota, ambil input manual)
    let finalVendorValue = select.value;
    if (finalVendorValue === 'その他') {
        finalVendorValue = otherInput.value.trim();
        // Validasi jika sonota dipilih tapi input manual kosong
        if (!finalVendorValue) {
            status.innerHTML = "<span style='color:red;'>❌ 購入先を入力してください</span>";
            btn.disabled = false;
            btn.innerHTML = "<span class='icon'>📩</span> 依頼データを送信";
            otherInput.focus();
            return;
        }
    }

    // Siapkan data untuk dikirim (Hanya Bahasa Jepang Saja)
    const formData = new URLSearchParams();
    formData.append('action', 'insert');
    formData.append('reqDate', document.getElementById('reqDate').value);
    formData.append('maker', document.getElementById('maker').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('vendor', finalVendorValue); // Sent to Sheets column E
    formData.append('code', document.getElementById('code').value);
    formData.append('itemName', document.getElementById('itemName').value);
    formData.append('qty', document.getElementById('qty').value);
    formData.append('unit', document.getElementById('unit').value);
    formData.append('pic', document.getElementById('pic').value);

    try {
        // Cek koneksi API sebelum kirim
        if(SCRIPT_URL === "URL_APPS_SCRIPT_ANDA") { throw new Error("API URL not set"); }

        await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        
        status.innerHTML = "<span style='color:var(--success-color);'>✅ 送信成功</span>";
        document.getElementById('purchaseForm').reset();
        otherInput.style.display = 'none'; // Sembunyikan input manual setelah reset
        
        // Popup sukses (elegan)
        alert("購入依頼を送信しました。");
        
    } catch (error) {
        console.error(error);
        if(error.message === "API URL not set") {
            status.innerHTML = "<span style='color:red;'>❌ エラー: API URLが設定されていません</span>";
        } else {
            status.innerHTML = "<span style='color:red;'>❌ 送信失敗 (ネットワークエラー)</span>";
        }
    }
    
    btn.disabled = false;
    btn.innerHTML = "<span class='icon'>📩</span> 依頼データを送信";
    // Bersihkan pesan status setelah beberapa detik
    setTimeout(() => { if(status.innerHTML.includes('成功')) status.innerHTML = ""; }, 4000);
}

// ========================================
// LOGIKA PEMUATAN & MANAJEMEN RIWAYAT
// ========================================
async function loadData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px;'>🔄 データを読み込んでいます...</td></tr>";
    
    try {
        if(SCRIPT_URL === "URL_APPS_SCRIPT_ANDA") { throw new Error("API URL not set"); }

        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        globalData = data; // Simpan data ke global untuk print
        
        tbody.innerHTML = "";
        
        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px;'>発注履歴がありません。</td></tr>";
            return;
        }

        // Looping data (terbaru di atas)
        for (let i = data.length - 1; i >= 0; i--) {
            const item = data[i];
            const isDone = item['ステータス'] === '済み';
            const statusClass = isDone ? 'status-zumi' : 'status-mi';
            
            // Tombol aksi (Hapus bahasa Indonesia)
            let actionHtml = `<button class="btn-secondary btn-action" onclick="printSingle('${item['ID']}')">🖨️ 印刷</button>`;
            if (!isDone) {
                actionHtml += `<button class="btn-print btn-action" onclick="markAsDone('${item['ID']}')">✔️ 納品</button>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td class="col-id">${item['ID'].substring(item['ID'].length - 6)}</td>
                    <td>${formatDateJP(item['購入依頼日'])}</td>
                    <td>${item['メーカー']}</td>
                    <td>${item['型式']}</td>
                    <td>${item['品名']}</td>
                    <td>${item['数量']} ${item['単位']}</td>
                    <td>${item['担当者']}</td>
                    <td><span class="${statusClass}">${item['ステータス']}</span></td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error(error);
        if(error.message === "API URL not set") {
            tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px; color:red;'>❌ エラー: script.js内のAPI URLを設定してください。</td></tr>";
        } else {
            tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; padding: 40px; color:red;'>❌ データの読み込みに失敗しました。</td></tr>";
        }
    }
}

// Fungsi Konfirmasi Centang Barang Datang
async function markAsDone(id) {
    if(!confirm("このアイテムを納品済みにしますか？\n(ステータス：未 -> 済み)")) return;
    
    const formData = new URLSearchParams();
    formData.append('action', 'update_status');
    formData.append('id', id);

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        alert("✅ ステータスを「済み」に更新しました。");
        loadData(); // Refresh tabel setelah update
    } catch (error) {
        console.error(error);
        alert("❌ ステータスの更新に失敗しました。");
    }
}

// Fungsi Format Tanggal Bahasa Jepang (YYYY/MM/DD)
function formatDateJP(dateString) {
    if(!dateString) return "";
    const d = new Date(dateString);
    if(isNaN(d)) return dateString; // Jika bukan format tanggal valid
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

// Fungsi Gabungkan Nama & Model (Untuk print elegan)
function combineNameModel(name, model) {
    if(!model) return name;
    return `${name}<br><span style="font-size:9px; color:#666;">(${model})</span>`;
}

// =========================================
// ELEGAN PRINT LOGIC (A4 PORTRAIT) 
// =========================================

// Cetak 1 Item Saja
function printSingle(id) {
    const item = globalData.find(x => x['ID'] === id);
    if(!item) { alert("データが見つかりません。"); return; }
    
    // Set Metadata Print
    document.getElementById('print-date').innerText = new Date().toLocaleDateString('ja-JP');
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = "";
    
    // Masukkan data 1 baris (tampilan cetak elegan)
    tbody.innerHTML = `
        <tr>
            <td style="text-align:center;">${formatDateJP(item['購入依頼日'])}</td>
            <td>${item['メーカー']}</td>
            <td>${combineNameModel(item['品名'], item['型式'])}</td>
            <td>${item['購入先']}</td>
            <td style="text-align:center;">${item['数量']} ${item['単位']}</td>
            <td>${item['担当者']}</td>
            <td style="text-align:center;">${item['ステータス']}</td>
        </tr>
    `;
    
    // Panggil print bawaan browser
    window.print();
}

// Cetak Bulanan (30 Item Terakhir - Elegan)
function printMonthly() {
    if(globalData.length === 0) { alert("印刷するデータがありません。"); return; }
    if(!confirm("月次レポートを印刷しますか？\n(最新の30件が出力されます)")) return;

    // Set Metadata Print
    document.getElementById('print-date').innerText = new Date().toLocaleDateString('ja-JP');
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = "";
    
    // Ambil maksimal 30 item terbaru untuk satu halaman A4 yang rapi
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
                <td style="text-align:center;">${item['ステータス']}</td>
            </tr>
        `;
    });
    
    // Panggil print bawaan browser
    window.print();
}
