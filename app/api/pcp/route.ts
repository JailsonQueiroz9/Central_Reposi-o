import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');

    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AK`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    if (barcode) {
      const filtered = data.filter(item => 
        item.solicitante_barcode === barcode || 
        item.destinatario_barcode === barcode ||
        item.ordem_pai === barcode
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching from Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sheets = await getGoogleSheetsClient();

    // Flatten the object for the sheet
    const row = [
      Date.now().toString(), // ID
      body.solicitante.barcode,
      body.solicitante.nome,
      body.solicitante.funcao,
      body.solicitante.setor,
      body.solicitante.descCel,
      body.solicitante.codCracha,
      body.solicitante.predio,
      body.solicitante.celula,
      body.solicitante.turno,
      body.destinatario.barcode,
      body.destinatario.nome,
      body.destinatario.funcao,
      body.destinatario.setor,
      body.destinatario.descCel,
      body.destinatario.codCracha,
      body.destinatario.predio,
      body.destinatario.celula,
      body.destinatario.turno,
      body.ordem.pai,
      body.ordem.rep,
      body.ordem.req,
      body.ordem.prioridade,
      body.ordem.marca,
      body.ordem.modelo,
      body.ordem.combinacao,
      body.ordem.documento,
      body.ordem.tipo,
      body.ordem.dataFecha,
      body.ordem.semana,
      body.ordem.giro,
      body.entrega.barcode,
      body.entrega.nome,
      body.entrega.descCel,
      body.entrega.turno,
      body.entrega.funcao,
      new Date().toISOString() // CreatedAt
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AK`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error appending to Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body; // We need an ID to know which row to update

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // ID is in column A
    });

    const ids = response.data.values?.map(row => row[0]);
    const rowIndex = ids?.indexOf(id);

    if (rowIndex === undefined || rowIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // 2. Update the row (rowIndex + 1 because Sheets is 1-indexed)
    const rowNumber = rowIndex + 1;
    const row = [
      id,
      body.solicitante.barcode,
      body.solicitante.nome,
      body.solicitante.funcao,
      body.solicitante.setor,
      body.solicitante.descCel,
      body.solicitante.codCracha,
      body.solicitante.predio,
      body.solicitante.celula,
      body.solicitante.turno,
      body.destinatario.barcode,
      body.destinatario.nome,
      body.destinatario.funcao,
      body.destinatario.setor,
      body.destinatario.descCel,
      body.destinatario.codCracha,
      body.destinatario.predio,
      body.destinatario.celula,
      body.destinatario.turno,
      body.ordem.pai,
      body.ordem.rep,
      body.ordem.req,
      body.ordem.prioridade,
      body.ordem.marca,
      body.ordem.modelo,
      body.ordem.combinacao,
      body.ordem.documento,
      body.ordem.tipo,
      body.ordem.dataFecha,
      body.ordem.semana,
      body.ordem.giro,
      body.entrega.barcode,
      body.entrega.nome,
      body.entrega.descCel,
      body.entrega.turno,
      body.entrega.funcao,
      body.updatedAt || new Date().toISOString()
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:AK${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const ids = response.data.values?.map(row => row[0]);
    const rowIndex = ids?.indexOf(id);

    if (rowIndex === undefined || rowIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // 2. Clear the row (Sheets API doesn't have a simple "delete row" that shifts up without batchUpdate)
    // For simplicity, we clear the content. A better way is batchUpdate with deleteDimension.
    const rowNumber = rowIndex + 1;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:AK${rowNumber}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting from Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
