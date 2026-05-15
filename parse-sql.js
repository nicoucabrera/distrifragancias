const fs = require('fs');
const path = require('path');

const sqlFile = 'c:\\\\Users\\\\nicou\\\\Desktop\\\\DISTRIFRAGANCIAS.sql';
const content = fs.readFileSync(sqlFile, 'utf8');

const lines = content.split('\n');
const perfumes = [];

for (const line of lines) {
  if (line.startsWith('INSERT INTO `PERFUMES`')) {
    const match = line.match(/VALUES \('([^']*)', '([^']*)', '([^']*)', '([^']*)'\);/);
    if (match) {
      const [, marca, nombre, usdt, pesos] = match;
      const pesosNum = parseInt(pesos);
      // Skip entries with invalid or missing price data
      if (!isNaN(pesosNum) && pesosNum > 0) {
        perfumes.push({
          id: perfumes.length + 1,
          marca,
          nombre,
          usdt,
          pesos: pesosNum
        });
      }
    }
  }
}

const output = `export interface Perfume {
  id: number;
  marca: string;
  nombre: string;
  usdt: string;
  pesos: number;
}

export const perfumes: Perfume[] = ${JSON.stringify(perfumes, null, 2)};
`;

fs.writeFileSync('lib/perfumes-data.ts', output);
console.log('Updated perfumes-data.ts with new data');