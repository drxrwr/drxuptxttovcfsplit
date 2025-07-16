// Ganti § jadi spasi
function parseWithSpasi(text) {
  return text.replace(/§/g, ' ').trim();
}

// Tambah + jika tidak diawali + atau 0
function formatPhoneNumber(num) {
  if (num.startsWith('+') || num.startsWith('0')) return num;
  return '+' + num;
}

// Tambahkan padding nol di depan nomor
function padNumber(num, totalLength) {
  return num.toString().padStart(totalLength, '0');
}

document.getElementById("txtFileInput").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    document.getElementById("numberTextArea").value = lines.join("\n");
    document.getElementById("totalNumberInfo").innerText = `Total nomor: ${lines.length}`;
  };
  reader.readAsText(file);
});

document.getElementById("splitVCFButton").addEventListener("click", async function () {
  const rawNumbers = document.getElementById("numberTextArea").value.trim();
  const nameBase = document.getElementById("contactNameInput").value.trim();
  const contactsPerFile = parseInt(document.getElementById("contactsPerFile").value) || 100;

  let startNumber = parseInt(document.getElementById("startNumberInput").value);
  if (isNaN(startNumber)) startNumber = 1;

  const fileNameRaw = document.getElementById("splitFileNameInput").value;
  const additionalFileName = parseWithSpasi(document.getElementById("additionalFileNameInput").value);
  const useCustomName = document.getElementById("customNameCheckbox").checked;

  if (!rawNumbers) {
    alert("Isi daftar nomor tidak boleh kosong.");
    return;
  }

  const numbers = rawNumbers
    .split(/\r?\n/)
    .map((n) => formatPhoneNumber(n.trim()))
    .filter((n) => n);

  const totalKontak = numbers.length;
  const digitLength = totalKontak.toString().length;

  const chunks = [];
  for (let i = 0; i < numbers.length; i += contactsPerFile) {
    chunks.push(numbers.slice(i, i + contactsPerFile));
  }

  const outputDiv = document.getElementById("splitVcfFiles");
  outputDiv.innerHTML = "";

  const zip = new JSZip();

  chunks.forEach((chunk, chunkIndex) => {
    const fileIndex = startNumber + chunkIndex;
    const parsedFileName = parseWithSpasi(fileNameRaw).trimEnd(); // Hapus spasi belakang
    const currentFileName = `${parsedFileName}${fileIndex}${additionalFileName ? " " + additionalFileName : ""}`.trim();

    let vcfContent = "";

    chunk.forEach((number, idx) => {
      const localIndex = idx + 1;
      const globalIndex = chunkIndex * contactsPerFile + idx + 1;

      const formattedLocal = padNumber(localIndex, digitLength);
      const formattedGlobal = padNumber(globalIndex, digitLength);

      let contactName = "";

      if (useCustomName) {
        const parsedNameFile = parseWithSpasi(fileNameRaw).trimEnd();
        contactName = `${parseWithSpasi(nameBase)} ${parsedNameFile}${fileIndex} ${additionalFileName} ${formattedLocal}`.trim();
      } else {
        contactName = nameBase
          ? `${parseWithSpasi(nameBase)} ${formattedGlobal}`
          : `kontak ${formattedGlobal}`;
      }

      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL:${number}\nEND:VCARD\n`;
    });

    // Tampilkan link download file
    const blob = new Blob([vcfContent], { type: "text/vcard" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentFileName}.vcf`;
    link.textContent = `Download ${link.download}`;
    outputDiv.appendChild(link);
    outputDiv.appendChild(document.createElement("br"));

    // Tambahkan ke file zip
    zip.file(`${currentFileName}.vcf`, vcfContent);
  });

  // Buat ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipLink = document.createElement("a");

  const lastFileIndex = startNumber + chunks.length - 1;
  const zipFileName = `${parseWithSpasi(fileNameRaw).trimEnd()}${startNumber}-${lastFileIndex}${additionalFileName ? " " + additionalFileName : ""}`.replace(/\s+/g, "_");

  zipLink.href = URL.createObjectURL(zipBlob);
  zipLink.download = `${zipFileName}.zip`;
  zipLink.textContent = `📦 Download Semua (${zipLink.download})`;
  zipLink.style.fontWeight = "bold";
  zipLink.style.display = "block";
  zipLink.style.marginTop = "20px";
  outputDiv.appendChild(zipLink);
});
