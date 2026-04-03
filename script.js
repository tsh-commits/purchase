// GANTI URL INI DENGAN URL DEPLOY DARI GOOGLE APPS SCRIPT ANDA!
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynAANfU1yTThgAUhd7uXX0ya0LmgqV3CJ3RUFn9edxVrTRVcrxdnvVMpb8zVc_aD2sAQ/exec"; 

let globalData = []; // Menyimpan data sementara untuk keperluan print

// Fungsi Berpindah Tab
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabName === 'history') {
        loadData();
    }
}

// Fungsi Mengirim Data Baru (Form Input)
async function submitData(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const status = document.getElementById('formStatus');
    
    btn.disabled = true;
    btn.innerText = "送信中... (Mengirim)";
    
    // Siapkan data
    const formData = new URLSearchParams();
    formData.append('action', 'insert');
    formData.append('reqDate', document.getElementById('reqDate').value);
    formData.append('maker', document.getElementById('maker').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('vendor', document.getElementById('vendor').value);
    formData.append('code', document.getElementById('code').value);
    formData.append('itemName', document.getElementById('itemName').value);
    formData.append('qty', document.getElementById('qty').value);
    formData.append('unit', document.getElementById('unit').value);
    formData.append('pic', document.getElementById('pic').value);

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        status.innerHTML = "<p style='color:green; margin-top:10px;'>✅ 送信成功 (Berhasil disimpan!)</p>";
        document.getElementById('purchaseForm').reset();
    } catch (error) {
        status.innerHTML = "<p style='color:red;'>❌ エラー (Terjadi kesalahan)</p>";
    }
    
    btn.disabled = false;
    btn.innerText = "送信 (Kirim)";
    setTimeout(() => status.innerHTML = "", 3000);
}

// Fungsi Memuat Data Riwayat
async function loadData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "<tr><td colspan='9' style='text-align: center;'>データを読み込んでいます... (Loading)</td></tr>";
    
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        globalData = data; // Simpan ke global
        
        tbody.innerHTML = "";
        
        // Looping data dari belakang agar yang terbaru di atas
        for (let i = data.length - 1; i >= 0; i--) {
            const item = data[i];
            const isDone = item['ステータス'] === '済み';
            const statusClass = isDone ? 'status-zumi' : 'status-mi';
            
            // Tombol aksi
            let actionHtml = `<button class="btn-secondary btn-action" onclick="printSingle('${item['ID']}')">🖨️ 印刷</button>`;
            if (!isDone) {
                actionHtml += `<button class="btn-print btn-action" onclick="markAsDone('${item['ID']}')">✔️ 納品 (Selesai)</button>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${item['ID'].substring(0, 8)}...</td>
                    <td>${formatDate(item['購入依頼日'])}</td>
                    <td>${item['メーカー']}</td>
                    <td>${item['型式']}</td>
                    <td>${item['品名']}</td>
                    <td>${item['数量']} ${item['単位']}</td>
                    <td>${item['担当者']}</td>
                    <td class="${statusClass}">${item['ステータス']}</td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }
    } catch (error) {
        tbody.innerHTML = "<tr><td colspan='9' style='text-align: center; color: red;'>データの読み込みに失敗しました (Gagal memuat data)</td></tr>";
    }
}

// Fungsi Centang Barang Datang (Ubah ke 済み)
async function markAsDone(id) {
    if(!confirm("納品済みにしますか？ (Tandai barang sudah datang?)")) return;
    
    const formData = new URLSearchParams();
    formData.append('action', 'update_status');
    formData.append('id', id);

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        alert("✅ ステータスを更新しました (Status diperbarui)");
        loadData(); // Refresh tabel
    } catch (error) {
        alert("❌ エラーが発生しました (Error update)");
    }
}

// Fungsi Format Tanggal agar cantik
function formatDate(dateString) {
    if(!dateString) return "";
    const d = new Date(dateString);
    return isNaN(d) ? dateString : `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

// Fungsi Cetak 1 Item Saja
function printSingle(id) {
    const item = globalData.find(x => x['ID'] === id);
    if(!item) return;
    
    document.getElementById('print-date').innerText = new Date().toLocaleDateString('ja-JP');
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = `
        <tr>
            <td>${formatDate(item['購入依頼日'])}</td>
            <td>${item['メーカー']}</td>
            <td>${item['型式']}</td>
            <td>${item['品名']}</td>
            <td>${item['数量']} ${item['単位']}</td>
            <td>${item['担当者']}</td>
            <td>${item['ステータス']}</td>
        </tr>
    `;
    window.print();
}

// Fungsi Cetak Semua (Bulan Ini)
function printMonthly() {
    document.getElementById('print-date').innerText = new Date().toLocaleDateString('ja-JP');
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = "";
    
    // Tampilkan hanya 30 transaksi terakhir atau filter bulan di sini
    globalData.slice(-30).reverse().forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${formatDate(item['購入依頼日'])}</td>
                <td>${item['メーカー']}</td>
                <td>${item['型式']}</td>
                <td>${item['品名']}</td>
                <td>${item['数量']} ${item['単位']}</td>
                <td>${item['担当者']}</td>
                <td>${item['ステータス']}</td>
            </tr>
        `;
    });
    window.print();
}
