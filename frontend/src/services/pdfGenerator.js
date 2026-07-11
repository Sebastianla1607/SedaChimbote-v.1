import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Helper para cargar imágenes asíncronamente y convertirlas a Base64 para jsPDF
const getBase64Image = async (url) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error fetching image for PDF', error)
    return null
  }
}

const priorityLabels = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  EXTREMA: 'Emergencia'
}

const statusLabels = {
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignado',
  EN_CAMINO: 'En Camino',
  EJECUCION_ACTIVA: 'En Proceso',
  PRE_CERRADO: 'Pre-Cerrado',
  OBSERVADO: 'Observado',
  CERRADO: 'Cerrado'
}

export const generateTicketPDF = (ticket) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── Header azul ──
  doc.setFillColor(26, 35, 126)
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SEDACHIMBOTE S.A.', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Servicio de Agua Potable y Alcantarillado', pageWidth / 2, 22, { align: 'center' })
  doc.text('del Santa, Casma y Huarmey', pageWidth / 2, 28, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE RECLAMO', pageWidth / 2, 36, { align: 'center' })

  // ── Código y fecha ──
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(232, 234, 246)
  doc.rect(14, 48, pageWidth - 28, 16, 'F')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 35, 126)
  doc.text(`Código: ${ticket.code}`, 20, 58)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Fecha: ${new Date(ticket.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 20, 58, { align: 'right' })

  // ── Datos del reclamo ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 35, 126)
  doc.text('DATOS DEL RECLAMO', 14, 76)
  doc.setDrawColor(26, 35, 126)
  doc.line(14, 78, pageWidth - 14, 78)

  autoTable(doc, {
    startY: 82,
    head: [],
    body: [
      ['Estado', statusLabels[ticket.status] || ticket.status],
      ['Prioridad', priorityLabels[ticket.priority] || ticket.priority],
      ['Categoría', ticket.ai_category || 'Sin categoría'],
      ['Origen', ticket.origin === 'CIUDADANO' ? 'Reporte ciudadano' : 'Orden interna'],
      ['Dirección', ticket.address || 'No especificada'],
      ['Fecha límite (SLA)', new Date(ticket.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [240, 242, 255], textColor: [26, 35, 126] },
      1: { cellWidth: 'auto' }
    },
    styles: { fontSize: 10, cellPadding: 4 },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  })

  // ── Descripción ──
  const afterTable = doc.lastAutoTable.finalY + 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 35, 126)
  doc.text('DESCRIPCIÓN DEL PROBLEMA', 14, afterTable)
  doc.line(14, afterTable + 2, pageWidth - 14, afterTable + 2)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(10)
  const descLines = doc.splitTextToSize(ticket.description, pageWidth - 28)
  doc.text(descLines, 14, afterTable + 10)

  // ── Análisis IA ──
  if (ticket.ai_report) {
    const afterDesc = afterTable + 10 + (descLines.length * 6) + 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 35, 126)
    doc.text('ANÁLISIS DE INTELIGENCIA ARTIFICIAL', 14, afterDesc)
    doc.line(14, afterDesc + 2, pageWidth - 14, afterDesc + 2)

    doc.setFillColor(240, 242, 255)
    const reportLines = doc.splitTextToSize(ticket.ai_report, pageWidth - 36)
    doc.rect(14, afterDesc + 6, pageWidth - 28, (reportLines.length * 6) + 8, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.text(reportLines, 20, afterDesc + 12)

    if (ticket.ai_difficulty) {
      const afterReport = afterDesc + 6 + (reportLines.length * 6) + 14
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(26, 35, 126)
      doc.text(`Dificultad estimada: `, 14, afterReport)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(ticket.ai_difficulty, 60, afterReport)
    }
  }

  // ── Técnico asignado ──
  if (ticket.assigned_esp?.access_code) {
    const yTech = doc.lastAutoTable ? doc.lastAutoTable.finalY + 80 : 200
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 35, 126)
    doc.text('TÉCNICO ASIGNADO', 14, yTech)
    doc.line(14, yTech + 2, pageWidth - 14, yTech + 2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.text(`Código: ${ticket.assigned_esp.access_code}`, 14, yTech + 10)
  }

  // ── Footer ──
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFillColor(26, 35, 126)
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SEDACHIMBOTE S.A. — Sistema de Gestión de Reclamos', pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, pageHeight - 6, { align: 'center' })

  // Descargar
  doc.save(`Reclamo-${ticket.code}.pdf`)
}

export const generateFinalTicketPDF = async (ticket) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── Header azul ──
  doc.setFillColor(26, 35, 126)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SEDACHIMBOTE S.A.', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('REPORTE FINAL DE ATENCIÓN DE RECLAMO', pageWidth / 2, 25, { align: 'center' })
  
  // ── Código y fecha ──
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(240, 253, 244) // Fondo verde muy claro para indicar completado
  doc.rect(14, 48, pageWidth - 28, 16, 'F')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(22, 163, 74) // Texto verde
  doc.text(`Código: ${ticket.code} (CERRADO)`, 20, 58)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Fecha de Cierre: ${new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 20, 58, { align: 'right' })

  // ── Datos del reclamo ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 35, 126)
  doc.text('RESUMEN DEL CASO', 14, 76)
  doc.setDrawColor(26, 35, 126)
  doc.line(14, 78, pageWidth - 14, 78)

  autoTable(doc, {
    startY: 82,
    head: [],
    body: [
      ['Cliente', `${ticket.created_by?.first_name || ''} ${ticket.created_by?.last_name_pat || ''}`],
      ['Especialista asignado', ticket.assigned_esp?.first_name ? `${ticket.assigned_esp.first_name} (${ticket.assigned_esp.access_code})` : 'Sin asignar'],
      ['Problema reportado', ticket.description],
      ['Evaluación IA', ticket.ai_report || 'No aplica'],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [240, 242, 255], textColor: [26, 35, 126] },
      1: { cellWidth: 'auto' }
    },
    styles: { fontSize: 10, cellPadding: 4 },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  })

  // ── Reporte del Técnico ──
  let nextY = doc.lastAutoTable.finalY + 15
  
  if (ticket.tech_report) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 35, 126)
    doc.text('REPORTE TÉCNICO DE CAMPO', 14, nextY)
    doc.line(14, nextY + 2, pageWidth - 14, nextY + 2)

    doc.setFillColor(240, 249, 255)
    const techReportLines = doc.splitTextToSize(ticket.tech_report.description, pageWidth - 36)
    doc.rect(14, nextY + 6, pageWidth - 28, (techReportLines.length * 6) + 8, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.text(techReportLines, 20, nextY + 12)
    nextY = nextY + 6 + (techReportLines.length * 6) + 15
  }

  // ── Evidencias Fotográficas ──
  if (ticket.evidences && ticket.evidences.length > 0) {
    if (nextY > 230) {
      doc.addPage()
      nextY = 20
    }
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 35, 126)
    doc.text('EVIDENCIAS FOTOGRÁFICAS', 14, nextY)
    doc.line(14, nextY + 2, pageWidth - 14, nextY + 2)
    
    nextY += 10
    
    // Calcular posiciones
    let imgX = 14
    let imgY = nextY
    const imgWidth = 55
    const imgHeight = 55
    
    for (const ev of ticket.evidences) {
      if (imgX + imgWidth > pageWidth - 14) {
        imgX = 14
        imgY += imgHeight + 10
      }
      
      if (imgY + imgHeight > 270) {
        doc.addPage()
        imgX = 14
        imgY = 20
      }

      try {
        const base64Img = await getBase64Image(ev.image_url)
        if (base64Img) {
          doc.addImage(base64Img, 'JPEG', imgX, imgY, imgWidth, imgHeight)
          
          // Etiqueta de la imagen
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          const label = ev.type === 'REPORTE_INICIAL' ? 'Reporte Inicial' : 'Foto del Técnico'
          doc.text(label, imgX + (imgWidth/2), imgY + imgHeight + 4, { align: 'center' })
        }
      } catch (err) {
        console.error('Error adding image', err)
      }
      imgX += imgWidth + 5
    }
    nextY = imgY + imgHeight + 15
  }

  // ── Footer ──
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFillColor(26, 35, 126)
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SEDACHIMBOTE S.A. — Sistema de Gestión de Reclamos', pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, pageHeight - 6, { align: 'center' })

  // Descargar
  doc.save(`Reporte_Final_${ticket.code}.pdf`)
}