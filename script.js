let pemain = [];
let hasil = [];
let menang = {};
let matchdays = [];

function simpanKeLocalStorage() {
  localStorage.setItem("liga_pemain", JSON.stringify(pemain));
  localStorage.setItem("liga_hasil", JSON.stringify(hasil));
  localStorage.setItem("liga_menang", JSON.stringify(menang));
}

function muatDariLocalStorage() {
  const p = localStorage.getItem("liga_pemain");
  const h = localStorage.getItem("liga_hasil");
  const m = localStorage.getItem("liga_menang");

  if (p && h && m) {
    pemain = JSON.parse(p);
    hasil = JSON.parse(h);
    menang = JSON.parse(m);

    // Tambahkan round 1 jika belum ada
    hasil.forEach(h => {
      if (!h.round) h.round = 1;
    });

    buatMatchdays(1);
    renderMatchdays();
    updateKlasemen();
    document.getElementById('jadwal').style.display = 'block';
    document.getElementById('klasemen').style.display = 'block';
  }
}

function generateForm() {
  const jumlah = parseInt(document.getElementById('jumlah').value);
  const container = document.getElementById('form-nama');
  const errorDiv = document.getElementById('error');
  container.innerHTML = '';
  errorDiv.innerText = '';

  if (isNaN(jumlah) || jumlah < 2) {
    errorDiv.innerText = 'Minimal 2 pemain.';
    return;
  }

  for (let i = 0; i < jumlah; i++) {
    container.innerHTML += `Nama Pemain ${i + 1}: <input type="text" id="pemain-${i}" /><br>`;
  }
}
function showModal(pesan, onConfirm) {
  document.getElementById('modal-message').innerText = pesan;
  document.getElementById('warning-modal').style.display = 'flex';
  document.getElementById('lanjutkan-btn').onclick = function () {
    tutupModal();
    onConfirm();
  };
}

function tutupModal() {
  document.getElementById('warning-modal').style.display = 'none';
}
function buatJadwal() {
  const jumlah = parseInt(document.getElementById('jumlah').value);
  if (jumlah > 24) {
    showModal(`⚠️ ${jumlah} pemain billiard? Bro, ini turnamen RT atau Piala Dunia? ${(jumlah * (jumlah - 1)) / 2} pertandingan? Servernya pun minta cuti.`, lanjutkanBikinJadwal);
    return;
  }
  lanjutkanBikinJadwal();
}
function lanjutkanBikinJadwal() {
  pemain = [];
  hasil = [];
  menang = {};
  const errorDiv = document.getElementById('error');
  errorDiv.innerText = '';

  const jumlah = parseInt(document.getElementById('jumlah').value);
  for (let i = 0; i < jumlah; i++) {
    const nama = document.getElementById(`pemain-${i}`).value.trim();
    if (!nama) {
      errorDiv.innerText = `Nama pemain ke-${i + 1} tidak boleh kosong.`;
      return;
    }
    if (pemain.includes(nama)) {
      errorDiv.innerText = `Nama pemain "${nama}" duplikat.`;
      return;
    }
    pemain.push(nama);
    menang[nama] = 0;
  }

  for (let i = 0; i < pemain.length; i++) {
    for (let j = i + 1; j < pemain.length; j++) {
      hasil.push({ a: pemain[i], b: pemain[j], pemenang: null, round: 1 });
    }
  }

  shuffleArray(hasil);
  buatMatchdays(1);
  renderMatchdays();

  document.getElementById('jadwal').style.display = 'block';
  document.getElementById('klasemen').style.display = 'block';
  updateKlasemen();
  simpanKeLocalStorage();
}


function buatMatchdays(round = 1) {
  matchdays = matchdays.filter(md => md.round !== round);
  const pendingMatches = hasil.filter(h => h.round === round);
  const newMatchdays = [];

  while (pendingMatches.length > 0) {
    const md = [];
    const pemainDipakai = new Set();

    for (let i = 0; i < pendingMatches.length; i++) {
      const match = pendingMatches[i];
      if (!pemainDipakai.has(match.a) && !pemainDipakai.has(match.b)) {
        md.push(match);
        pemainDipakai.add(match.a);
        pemainDipakai.add(match.b);
        pendingMatches.splice(i, 1);
        i--;
      }
    }

    newMatchdays.push({ pertandingan: md, round });
  }

  matchdays = matchdays.concat(newMatchdays);
}

function renderMatchdays() {
  const tabel = document.getElementById('tabel-jadwal');
  tabel.innerHTML = '';

    const roundTertinggi = Math.max(...hasil.map(h => h.round));
  document.querySelector('button[onclick="shuffleJadwal()"]').style.display =
    roundTertinggi > 1 ? 'none' : 'inline-block';

  matchdays.forEach((md, index) => {
    tabel.innerHTML += `
      <tr class="matchday-title"><td colspan="3">Matchday ${index + 1} (Round ${md.round})</td></tr>
      <tr><th>Pemain A</th><th>Pemain B</th><th>Hasil</th></tr>
    `;
    let highlightGiven = false;

    md.pertandingan.forEach(match => {
      const { a, b, pemenang } = match;
      const id = `${a}__vs__${b}__round${match.round}`;
      let hasilText = `
        <button onclick="catatKemenangan('${a}', '${b}', '${id}')">${a} Menang</button>
        <button onclick="catatKemenangan('${b}', '${a}', '${id}')">${b} Menang</button>
      `;
      if (pemenang) {
        hasilText = `<span class="winner">${pemenang} menang</span>
        <button onclick="undoHasil('${pemenang}', '${id}')">Undo</button>`;
      }

      const highlightClass = !pemenang && !highlightGiven ? 'highlight' : '';
      if (!pemenang && !highlightGiven) highlightGiven = true;

      tabel.innerHTML += `
        <tr id="${id}" class="${highlightClass}">
          <td data-label="Pemain A">${a}</td>
          <td data-label="Pemain B">${b}</td>
          <td data-label="Hasil">${hasilText}</td>
        </tr>
      `;
    });
  });
}

function catatKemenangan(pemenang, kalah, rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const match = hasil.find(h =>
    ((h.a === pemenang && h.b === kalah) || (h.b === pemenang && h.a === kalah)) &&
    `${h.a}__vs__${h.b}__round${h.round}` === rowId
  );
  if (match && !match.pemenang) {
    match.pemenang = pemenang;
    menang[pemenang]++;
    row.querySelector('td:nth-child(3)').innerHTML = `
      <span class="winner">${pemenang} menang</span>
      <button onclick="undoHasil('${pemenang}', '${rowId}')">Undo</button>
    `;
    updateKlasemen();
    simpanKeLocalStorage();
  }
}

function undoHasil(pemenang, rowId) {
  const row = document.getElementById(rowId);
  const match = hasil.find(h =>
    h.pemenang === pemenang && `${h.a}__vs__${h.b}__round${h.round}` === rowId
  );

  if (match && match.pemenang) {
    match.pemenang = null;
    menang[pemenang]--;
    const a = match.a;
    const b = match.b;

    row.querySelector('td:nth-child(3)').innerHTML = `
      <button onclick="catatKemenangan('${a}', '${b}', '${rowId}')">${a} Menang</button>
      <button onclick="catatKemenangan('${b}', '${a}', '${rowId}')">${b} Menang</button>
    `;
    updateKlasemen();
    simpanKeLocalStorage();
  }
}

function updateKlasemen() {
  const tbody = document.querySelector('#tabel-klasemen tbody');
  tbody.innerHTML = '';

  const sorted = [...pemain].sort((a, b) => menang[b] - menang[a]);
  for (let nama of sorted) {
    const totalMain = hasil.filter(h => (h.a === nama || h.b === nama) && h.pemenang !== null).length;
    const totalMenang = menang[nama];
    const winPercentage = totalMain > 0 ? ((totalMenang / totalMain) * 100).toFixed(1) : '0.0';

    const histori = hasil
      .filter(h => (h.a === nama || h.b === nama) && h.pemenang)
      .map(h => {
        const lawan = h.a === nama ? h.b : h.a;
        const hasilMatch = h.pemenang === nama ? 'Menang' : 'Kalah';
        return `vs ${lawan} (${hasilMatch})`;
      }).join('<br>');

    tbody.innerHTML += `
      <tr>
        <td data-label="Nama">${nama}</td>
        <td data-label="Menang">${totalMenang}</td>
        <td data-label="Win %">${winPercentage}%</td>
        <td data-label="Histori">${histori}</td>
      </tr>
    `;
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function shuffleJadwal() {
  shuffleArray(hasil);
  buatMatchdays(1);
  renderMatchdays();
}

function mulaiPutaranSelanjutnya() {
  if (!pemain.length) {
    alert("Belum ada data pemain.");
    return;
  }

  const roundKe = Math.max(...hasil.map(h => h.round)) + 1;

  if (!confirm(`Mulai putaran ke-${roundKe}? Jadwal baru akan ditambahkan di bawah.`)) return;

  const hasilBaru = [];
  for (let i = 0; i < pemain.length; i++) {
    for (let j = i + 1; j < pemain.length; j++) {
      hasilBaru.push({ a: pemain[i], b: pemain[j], pemenang: null, round: roundKe });
    }
  }

  shuffleArray(hasilBaru);
  hasil = hasil.concat(hasilBaru);
  buatMatchdays(roundKe);
  renderMatchdays();
  simpanKeLocalStorage();
}


function resetLiga() {
  if (confirm('Yakin ingin reset semua data?')) {
    localStorage.removeItem("liga_pemain");
    localStorage.removeItem("liga_hasil");
    localStorage.removeItem("liga_menang");
    location.reload();
  }
}
function showModal(pesan, onLanjut) {
  const modal = document.getElementById("peringatanModal");
  const isi = document.getElementById("isiModal");
  const lanjutBtn = document.getElementById("lanjutModalBtn");

  isi.innerHTML = pesan;
  modal.showModal();

  // Hapus listener sebelumnya dulu
  const newLanjut = lanjutBtn.cloneNode(true);
  lanjutBtn.parentNode.replaceChild(newLanjut, lanjutBtn);

  newLanjut.addEventListener("click", () => {
    modal.close();
    if (typeof onLanjut === "function") onLanjut();
  });
}

function tutupModal() {
  document.getElementById('warning-modal').style.display = 'none';
}

function lanjutkanJadwal() {
  document.getElementById('warning-modal').style.display = 'none';
  lanjutkanBikinJadwal(); // Ini akan dipanggil kalau user setuju
}

window.onload = muatDariLocalStorage;
