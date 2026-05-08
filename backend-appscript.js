function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data = body.data;
    var result = null;

    switch (action) {
      case 'login':
        result = login(data);
        break;
      case 'register':
        result = register(data);
        break;
      case 'getUserByCracha':
        result = getUserByCracha(data);
        break;
      case 'getWipData':
        result = getSheetData('Wip042');
        break;
      case 'savePainelData':
        result = appendRow('Painel (status)', data);
        break;
      case 'saveMultiplePainelData':
        result = saveMultiplePainelData(data);
        break;
      case 'getPainelData':
        result = getSheetData('Painel (status)');
        break;
      case 'updatePainelData':
        result = updateRow('Painel (status)', data.id, data);
        break;
      case 'updateMultiplePainelData':
        result = updateMultiplePainelData(data);
        break;
      case 'deletePainelData':
        result = deleteRow('Painel (status)', data.id);
        break;
      case 'deleteMultiplePainelData':
        result = deleteMultiplePainelData(data);
        break;
      case 'getMaterialByProduto':
        result = getMaterialByProduto(data);
        break;
      case 'savePCPData':
        result = savePCPData(data);
        break;
      default:
        throw new Error("Ação não encontrada: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "API PCP System Online!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNÇÕES DE AUTENTICAÇÃO E USUÁRIOS
// ==========================================

function login(data) {
  var users = getSheetData('Cadastro de usuário');
  for (var i = 0; i < users.length; i++) {
    // As colunas na planilha são: ID, USUÁRIO, E-MAIL, SENHA, PAPEL, STATUS
    if (users[i]['E-MAIL'] === data.email && String(users[i]['SENHA']) === String(data.password)) {
      if (users[i]['STATUS'] !== 'ativo') {
        throw new Error("Usuário inativo");
      }
      return {
        id: users[i]['ID'],
        nome: users[i]['USUÁRIO'],
        email: users[i]['E-MAIL'],
        funcao: users[i]['PAPEL']
      };
    }
  }
  throw new Error("Credenciais inválidas");
}

function register(data) {
  var users = getSheetData('Cadastro de usuário');
  for (var i = 0; i < users.length; i++) {
    if (users[i]['E-MAIL'] === data.email) {
      throw new Error("E-mail já cadastrado");
    }
  }
  
  var newUser = {
    'ID': Utilities.getUuid(),
    'USUÁRIO': data.name,
    'E-MAIL': data.email,
    'SENHA': data.password,
    'PAPEL': data.role || 'User',
    'STATUS': 'ativo',
    'Permissões de Tela (Módulos)': '',
    'Bio': '',
    'Location': '',
    'Img': '',
    'Cargo': ''
  };
  
  appendRow('Cadastro de usuário', newUser);
  
  return {
    id: newUser['ID'],
    nome: newUser['USUÁRIO'],
    email: newUser['E-MAIL'],
    funcao: newUser['PAPEL']
  };
}

function getUserByCracha(data) {
  var users = getSheetData('Usuário (cracha)');
  var searchTerm = String(data.cracha).trim();
  
  for (var i = 0; i < users.length; i++) {
    // Busca pelo CRACHA ou CHAPA
    if (String(users[i]['CRACHA']) === searchTerm || String(users[i]['CHAPA']) === searchTerm) {
      return users[i];
    }
  }
  throw new Error("Usuário não encontrado com este crachá/chapa");
}

// ==========================================
// FUNÇÕES UTILITÁRIAS PARA O GOOGLE SHEETS
// ==========================================

function saveMultiplePainelData(dataArray) {
  var results = [];
  for (var i = 0; i < dataArray.length; i++) {
    results.push(appendRow('Painel (status)', dataArray[i]));
  }
  return results;
}

function updateMultiplePainelData(dataArray) {
  var results = [];
  for (var i = 0; i < dataArray.length; i++) {
    results.push(updateRow('Painel (status)', dataArray[i].id, dataArray[i]));
  }
  return results;
}

function deleteMultiplePainelData(dataArray) {
  var results = [];
  for (var i = 0; i < dataArray.length; i++) {
    results.push(deleteRow('Painel (status)', dataArray[i].id));
  }
  return results;
}

function getMaterialByProduto(data) {
  var materias = getSheetData('Matérias');
  var searchTerm = String(data.produto).trim().toLowerCase();
  
  for (var i = 0; i < materias.length; i++) {
    var prod = String(materias[i]['Produto'] || materias[i]['PRODUTO'] || materias[i]['produto'] || '').trim().toLowerCase();
    if (prod === searchTerm) {
      return materias[i];
    }
  }
  throw new Error("Material não encontrado");
}

function savePCPData(data) {
  var flatData = {
    id: data.id || Utilities.getUuid(),
    solicitante_barcode: data.solicitante.barcode,
    solicitante_nome: data.solicitante.nome,
    solicitante_funcao: data.solicitante.funcao,
    solicitante_setor: data.solicitante.setor,
    solicitante_descCel: data.solicitante.descCel,
    solicitante_codCracha: data.solicitante.codCracha,
    solicitante_predio: data.solicitante.predio,
    solicitante_celula: data.solicitante.celula,
    solicitante_turno: data.solicitante.turno,
    destinatario_barcode: data.destinatario.barcode,
    destinatario_nome: data.destinatario.nome,
    destinatario_funcao: data.destinatario.funcao,
    destinatario_setor: data.destinatario.setor,
    destinatario_descCel: data.destinatario.descCel,
    destinatario_codCracha: data.destinatario.codCracha,
    destinatario_predio: data.destinatario.predio,
    destinatario_celula: data.destinatario.celula,
    destinatario_turno: data.destinatario.turno,
    ordem_pai: data.ordem.pai,
    ordem_rep: data.ordem.rep,
    ordem_req: data.ordem.req,
    ordem_prioridade: data.ordem.prioridade,
    ordem_marca: data.ordem.marca,
    ordem_modelo: data.ordem.modelo,
    ordem_combinacao: data.ordem.combinacao,
    ordem_documento: data.ordem.documento,
    ordem_tipo: data.ordem.tipo,
    ordem_dataFecha: data.ordem.dataFecha,
    ordem_semana: data.ordem.semana,
    ordem_giro: data.ordem.giro,
    entrega_barcode: data.entrega.barcode,
    entrega_nome: data.entrega.nome,
    entrega_descCel: data.entrega.descCel,
    entrega_turno: data.entrega.turno,
    entrega_funcao: data.entrega.funcao
  };
  
  return appendRow('PCP_Data', flatData);
}

function getSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    // Adiciona o número da linha para facilitar updates/deletes
    obj._rowIndex = i + 1;
    result.push(obj);
  }
  
  return result;
}

function appendRow(sheetName, dataObj) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var headers = [];
  
  if (values.length === 0 || (values.length === 1 && values[0].join('') === '')) {
    headers = Object.keys(dataObj).filter(k => k !== '_rowIndex');
    sheet.appendRow(headers);
  } else {
    headers = values[0];
  }
  
  // Se não tiver ID, gera um
  if (!dataObj.id && !dataObj.ID && headers.indexOf('id') !== -1) {
    dataObj.id = Utilities.getUuid();
  }
  
  var rowToInsert = [];
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    rowToInsert.push(dataObj[header] !== undefined ? dataObj[header] : '');
  }
  
  var newKeys = Object.keys(dataObj).filter(function(key) { 
    return key !== '_rowIndex' && headers.indexOf(key) === -1; 
  });
  
  if (newKeys.length > 0) {
    for (var k = 0; k < newKeys.length; k++) {
      headers.push(newKeys[k]);
      sheet.getRange(1, headers.length).setValue(newKeys[k]);
      rowToInsert.push(dataObj[newKeys[k]]);
    }
  }
  
  sheet.appendRow(rowToInsert);
  return dataObj;
}

function updateRow(sheetName, id, dataObj) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Planilha não encontrada");
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idColumnIndex = headers.indexOf('id') !== -1 ? headers.indexOf('id') : headers.indexOf('ID');
  
  if (idColumnIndex === -1) throw new Error("Coluna de ID não encontrada");
  
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColumnIndex]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error("Registro não encontrado");
  
  for (var key in dataObj) {
    if (key === 'id' || key === 'ID' || key === '_rowIndex') continue;
    
    var colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(dataObj[key]);
    } else {
      // Adiciona nova coluna se não existir
      headers.push(key);
      sheet.getRange(1, headers.length).setValue(key);
      sheet.getRange(rowIndex, headers.length).setValue(dataObj[key]);
    }
  }
  
  return { success: true, id: id };
}

function deleteRow(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Planilha não encontrada");
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idColumnIndex = headers.indexOf('id') !== -1 ? headers.indexOf('id') : headers.indexOf('ID');
  
  if (idColumnIndex === -1) throw new Error("Coluna de ID não encontrada");
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColumnIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  throw new Error("Registro não encontrado");
}
