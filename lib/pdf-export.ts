import jsPDF from 'jspdf';
import { Book } from './supabase';

export function exportBooksToPDF(books: Book[], filename: string = 'books.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TomeSphere - Book Collection', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
    y += 5;
    doc.text(`Total Books: ${books.length}`, margin, y);
    y += 15;

    // Table headers
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Title', margin, y);
    doc.text('Author', margin + 80, y);
    doc.text('Genre', margin + 140, y);
    y += 7;

    // Draw line
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Books
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    books.forEach((book, index) => {
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        // Truncate long titles
        const title = book.title.length > 30 ? book.title.substring(0, 27) + '...' : book.title;
        const author = book.author.length > 25 ? book.author.substring(0, 22) + '...' : book.author;
        const genre = book.genre.length > 20 ? book.genre.substring(0, 17) + '...' : book.genre;

        doc.text(title, margin, y);
        doc.text(author, margin + 80, y);
        doc.text(genre, margin + 140, y);
        y += 7;

        // Add separator line every 5 books
        if ((index + 1) % 5 === 0) {
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
        }
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // Save PDF
    doc.save(filename);
}
