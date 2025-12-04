import ExcelJS from 'exceljs';

export async function generateApplicationsExcel(
  applications,
  companyName,
  date,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Applications');

  // Set worksheet properties
  worksheet.properties.defaultRowHeight = 20;

  // Define columns
  worksheet.columns = [
    { header: 'Application ID', key: 'applicationId', width: 25 },
    { header: 'Job Title', key: 'jobTitle', width: 30 },
    { header: 'Applicant Name', key: 'applicantName', width: 25 },
    { header: 'Applicant Email', key: 'applicantEmail', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Applied Date', key: 'appliedDate', width: 20 },
    { header: 'Applied Time', key: 'appliedTime', width: 15 },
    { header: 'CV Link', key: 'cvLink', width: 50 },
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  applications.forEach((app) => {
    const row = worksheet.addRow({
      applicationId: app._id.toString(),
      jobTitle: app.jobId?.jobTitle || 'N/A',
      applicantName: app.userId
        ? `${app.userId.firstName} ${app.userId.lastName}`
        : 'N/A',
      applicantEmail: app.userId?.email || 'N/A',
      status: app.status,
      appliedDate: new Date(app.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      appliedTime: new Date(app.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      cvLink: app.userCV?.secure_url || 'N/A',
    });

    // Style status column based on status value
    const statusCell = row.getCell('status');
    statusCell.font = { bold: true };

    switch (app.status.toLowerCase()) {
      case 'accepted':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' },
        };
        statusCell.font = { ...statusCell.font, color: { argb: 'FF006100' } };
        break;
      case 'rejected':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
        statusCell.font = { ...statusCell.font, color: { argb: 'FF9C0006' } };
        break;
      case 'in consideration':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' },
        };
        statusCell.font = { ...statusCell.font, color: { argb: 'FF9C6500' } };
        break;
      default:
        // pending, viewed, etc.
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' },
        };
    }

    // Center align status column
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Add borders to all cells
  /* eslint no-unused-vars: off */
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Add a title row at the top
  worksheet.spliceRows(1, 0, []);
  const titleRow = worksheet.getRow(1);
  titleRow.height = 30;
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${companyName} - Applications for ${date}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  };

  // Add summary row
  const summaryRowNumber = worksheet.rowCount + 2;
  worksheet.getRow(summaryRowNumber).values = [
    'Total Applications:',
    applications.length,
  ];
  const summaryRow = worksheet.getRow(summaryRowNumber);
  summaryRow.font = { bold: true };
  summaryRow.getCell(1).alignment = { horizontal: 'right' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
