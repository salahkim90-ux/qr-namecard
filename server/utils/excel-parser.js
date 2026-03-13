const XLSX = require('xlsx');

function parseOrderExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  // 필수 컬럼 검증
  const requiredCols = ['이름', '부서', '직책', '주소', '전화번호', '팩스', '휴대폰', 'email'];
  if (data.length > 0) {
    const cols = Object.keys(data[0]);
    const missing = requiredCols.filter(c => !cols.includes(c));
    if (missing.length > 0) {
      throw new Error(`엑셀에 누락된 컬럼: ${missing.join(', ')}`);
    }
  }

  return data;
}

module.exports = { parseOrderExcel };
