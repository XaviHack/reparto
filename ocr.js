// ── OCR PEDIDOS ────────────────────────────────────────────────────────────

function abrirModalOCR() {
  document.getElementById('modal-ocr').style.display = 'block';
  document.getElementById('ocr-text').value = '';
  document.getElementById('ocr-imagen').value = '';
}

function cerrarModalOCR() {
  document.getElementById('modal-ocr').style.display = 'none';
}

async function procesarOCR() {
  const texto = document.getElementById('ocr-text').value.trim();
  const imagen = document.getElementById('ocr-imagen').files[0];

  if (!texto && !imagen) {
    toast('Pegá un texto o seleccioná una imagen', 'ae');
    return;
  }

  let ocrResult = '';

  if (texto) {
    ocrResult = texto;
  } else {
    toast('Procesando imagen...', 'ai');

    try {
      const formData = new FormData();
      formData.append('image', imagen);
      formData.append('lang', 'spa');
      formData.append('oem', '1');
      formData.append('psm', '3');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        headers: {
          apikey: '45b8764d8888957', // free OCR.space API key
        },
      });

      const json = await response.json();
      const parsedResults = json.ParsedResults || [];

      ocrResult = parsedResults.length > 0 ? parsedResults[0].ParsedText : '';
    } catch (err) {
      console.error('OCR error', err);
      toast('Error procesando imagen', 'ae');
      return;
    }
  }

  // Extraer datos con RegEx
  const cliente = extraerCliente(ocrResult);
  const fecha = extraerFecha(ocrResult);
  const nota = extraerNota(ocrResult);
  const items = extraerItems(ocrResult);

  // Poblar campos
  if (cliente) document.getElementById('np-cliente').value = cliente;
  if (fecha) document.getElementById('np-fecha').value = fecha;
  if (nota) document.getElementById('np-nota').value = nota;

  // Agregar items
  items.forEach(item => {
    const prod = PRODUCTOS.find(p => p.nombre.toLowerCase().includes(item.nombre.toLowerCase()));
    if (prod) {
      agregarItem(prod.id, item.cantidad);
    }
  });

  cerrarModalOCR();
  toast('Datos extraídos del pedido', 'as');
}

function extraerCliente(texto) {
  const regex = /Cliente:\\s*([^\\n]+)/i;
  const match = texto.match(regex);
  return match ? match[1].trim() : '';
}

function extraerFecha(texto) {
  const regex = /Fecha:\\s*(\\d{2}\\/\\d{2}\\/\\d{4})/i;
  const match = texto.match(regex);
  return match ? match[1].trim().split('/').reverse().join('-') : '';
}

function extraerNota(texto) {
  const regex = /Nota:\\s*([^\\n]+)/i;
  const match = texto.match(regex);
  return match ? match[1].trim() : '';
}

function extraerItems(texto) {
  const regex = /^\\s*(\\d+)\\s+([^\\n]+)$/gm;
  const items = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const cantidad = parseInt(match[1], 10);
    const nombre = match[2].trim();
    items.push({ cantidad, nombre });
  }

  return items;
}
