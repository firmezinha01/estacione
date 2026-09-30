import { PrinterSize } from '../types/parking';

/**
 * High-reliability Thermal Ticket Printing Service
 * Uses isolated iframe printing and clean popup window fallbacks
 * to guarantee flawless output on thermal roll paper (58mm and 80mm).
 */

export function generateThermalPrintHtml(
  sourceEl: HTMLElement,
  size: PrinterSize = '80mm',
  title: string = 'Ticket Estacionamento'
): string {
  // Clone HTML
  const clone = sourceEl.cloneNode(true) as HTMLElement;

  // Remove any hidden elements from clone to prevent duplicate prints
  clone.querySelectorAll('.hidden, [hidden]').forEach(el => el.remove());

  // Ensure any canvas inside is converted to a crisp image
  const originalCanvases = sourceEl.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');
  originalCanvases.forEach((orig, idx) => {
    try {
      const dataUrl = orig.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.maxWidth = '100%';
      img.style.display = 'block';
      img.style.margin = '4px auto';
      if (cloneCanvases[idx] && cloneCanvases[idx].parentNode) {
        cloneCanvases[idx].parentNode?.replaceChild(img, cloneCanvases[idx]);
      }
    } catch (e) {
      console.warn('Erro ao converter canvas para imagem:', e);
    }
  });

  const widthMm = size === '58mm' ? '54mm' : '76mm';
  const maxPx = size === '58mm' ? '220px' : '310px';
  // Larger, bold font sizes for thermal paper (minimum 12px for 58mm, 13.5px for 80mm)
  const baseFontSize = size === '58mm' ? '12px' : '13.5px';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            margin: 0mm;
            size: ${size === '58mm' ? '58mm auto' : '80mm auto'};
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            color: #000000 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, Consolas, monospace !important;
            font-size: ${baseFontSize} !important;
            font-weight: 700 !important;
            line-height: 1.35;
            width: 100%;
            -webkit-font-smoothing: none;
          }
          .thermal-print-wrapper {
            width: ${widthMm};
            max-width: ${maxPx};
            margin: 0 auto;
            padding: 4px 6px;
            background: #ffffff !important;
            color: #000000 !important;
            text-align: center;
          }
          /* All text elements must print solid black with bold stroke */
          body, p, span, div, strong, b, td, th {
            color: #000000 !important;
            font-family: 'Courier New', Courier, Consolas, monospace !important;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 4px auto !important;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
          }
          .hidden, [hidden] {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .border-dashed, .border-dotted, .border-t, .border-b, hr {
            border-color: #000000 !important;
          }
        </style>
      </head>
      <body>
        <div class="thermal-print-wrapper">
          ${clone.innerHTML}
        </div>
      </body>
    </html>
  `;
}

export function printThermalElement(
  elementId: string = 'printable-ticket',
  size: PrinterSize = '80mm',
  title: string = 'Ticket Estacionamento'
): boolean {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.warn(`Elemento #${elementId} não encontrado no DOM. Tentando window.print().`);
    window.print();
    return false;
  }

  const ticketHtml = generateThermalPrintHtml(sourceEl, size, title);

  // Try printing via hidden isolated iframe
  let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(ticketHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Falha no print do iframe, abrindo popup:', printErr);
          openPrintWindow(ticketHtml);
        }
      }, 350);
      return true;
    }
  } catch (err) {
    console.warn('Erro ao acessar iframe de impressão, abrindo janela popup:', err);
    openPrintWindow(ticketHtml);
    return true;
  }

  openPrintWindow(ticketHtml);
  return true;
}

/**
 * Popup window fallback for restricted environments
 */
export function openPrintWindow(
  contentOrHtml: string | HTMLElement,
  size: PrinterSize = '80mm',
  title: string = 'Ticket Estacionamento'
): void {
  let finalHtml = '';
  if (typeof contentOrHtml === 'string') {
    if (contentOrHtml.includes('<html')) {
      finalHtml = contentOrHtml;
    } else {
      // It's raw inner/outer HTML, wrap in standard thermal template
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentOrHtml;
      finalHtml = generateThermalPrintHtml(tempDiv, size, title);
    }
  } else if (contentOrHtml instanceof HTMLElement) {
    finalHtml = generateThermalPrintHtml(contentOrHtml, size, title);
  }

  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(finalHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  } else {
    // If popups are blocked, standard print
    window.print();
  }
}
