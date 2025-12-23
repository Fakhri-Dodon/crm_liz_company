import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const quotationPDFPreview = async (openNewTab = true) => {
    const element = document.getElementById('quotation-pdf');
    
    if (!element) {
        alert("Elemen preview tidak ditemukan!");
        return;
    }

    // Mengambil screenshot elemen
    const canvas = await html2canvas(element, {
        scale: 3, // Resolusi tinggi agar teks tajam
        useCORS: true,
        logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Inisialisasi PDF A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const blob = pdf.output('blob');

    if (openNewTab) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    }

    return blob;
};