const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// ===============================
// FRONTEND
// ===============================

const FRONTEND_DIR = path.join(__dirname, "../frontend");

app.use(express.static(FRONTEND_DIR));

// ===============================
// BANCO DE DADOS
// ===============================

const DB_FILE = path.join(__dirname, "db.json");

function bancoPadrao() {
  return {
    usuarios: [
      {
        usuario: "triagem",
        senha: "123",
        tipo: "triagem"
      },
      {
        usuario: "medico",
        senha: "123",
        tipo: "medico"
      },
      {
        usuario: "atendimento",
        senha: "123",
        tipo: "atendimento"
      }
    ],
    pacientes: [],
    triagens: [],
    consultas: []
  };
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const novoBanco = bancoPadrao();

      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(novoBanco, null, 2),
        "utf8"
      );

      return novoBanco;
    }

    const conteudo = fs.readFileSync(DB_FILE, "utf8");

    if (!conteudo.trim()) {
      return bancoPadrao();
    }

    const db = JSON.parse(conteudo);

    // Garante que todas as áreas existam
    if (!Array.isArray(db.usuarios)) {
      db.usuarios = [];
    }

    if (!Array.isArray(db.pacientes)) {
      db.pacientes = [];
    }

    if (!Array.isArray(db.triagens)) {
      db.triagens = [];
    }

    if (!Array.isArray(db.consultas)) {
      db.consultas = [];
    }

    // Garante que os usuários de acesso existam
    const usuariosPadrao = bancoPadrao().usuarios;

    usuariosPadrao.forEach(usuarioPadrao => {
      const existe = db.usuarios.some(
        u => u.usuario === usuarioPadrao.usuario
      );

      if (!existe) {
        db.usuarios.push(usuarioPadrao);
      }
    });

    return db;

  } catch (error) {
    console.error("ERRO AO LER DB.JSON:", error);

    return bancoPadrao();
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;

  } catch (error) {
    console.error("ERRO AO SALVAR DB.JSON:", error);

    return false;
  }
}

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {

  try {

    const db = readDB();

    const usuarioDigitado = String(
      req.body.usuario || ""
    ).trim().toLowerCase();

    const senhaDigitada = String(
      req.body.senha || ""
    ).trim();

    console.log("Tentativa de login:", usuarioDigitado);

    const user = db.usuarios.find(u => {

      const usuarioBanco = String(
        u.usuario || ""
      ).trim().toLowerCase();

      const senhaBanco = String(
        u.senha || ""
      ).trim();

      return (
        usuarioBanco === usuarioDigitado &&
        senhaBanco === senhaDigitada
      );

    });

    if (!user) {

      console.log(
        "LOGIN RECUSADO PARA:",
        usuarioDigitado
      );

      return res.status(401).json({
        erro: "Usuário ou senha inválidos."
      });

    }

    console.log(
      "LOGIN ACEITO:",
      user.usuario,
      "-",
      user.tipo
    );

    return res.json({
      usuario: user.usuario,
      tipo: user.tipo
    });

  } catch (error) {

    console.error(
      "ERRO NO LOGIN:",
      error
    );

    return res.status(500).json({
      erro: "Erro interno no servidor."
    });

  }

});

// ===============================
// ATENDIMENTO
// ===============================

app.post("/atendimento", (req, res) => {

  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome || "",
    cpf: req.body.cpf || "",
    tipo: req.body.tipo || "",
    status: "triagem",
    createdAt: new Date().toISOString()
  };

  db.pacientes.push(paciente);

  writeDB(db);

  res.json(paciente);

});

// ===============================
// TRIAGEM
// ===============================

app.post("/triagem", (req, res) => {

  const db = readDB();

  let risco = req.body.risco;

  const temperatura = Number(
    req.body.temperatura
  );

  if (temperatura >= 39) {

    risco = "vermelho";

  } else if (temperatura >= 38) {

    risco = "amarelo";

  } else if (!risco) {

    risco = "verde";

  }

  const triagem = {

    id: Date.now(),

    nome: req.body.nome || "",

    sintoma:
      req.body.sintoma ||
      req.body.sintomas ||
      "",

    temperatura:
      req.body.temperatura ||
      req.body.temp ||
      "",

    alergia:
      req.body.alergia || "",

    observacao:
      req.body.observacao || "",

    risco: risco,

    status: "aguardando_medico",

    createdAt:
      new Date().toISOString()

  };

  db.triagens.push(triagem);

  writeDB(db);

  res.json(triagem);

});

// ===============================
// LISTAR TRIAGENS
// ===============================

app.get("/triagens", (req, res) => {

  const db = readDB();

  res.json(db.triagens);

});

// ===============================
// LISTA DE MEDICAÇÕES
// ===============================

app.get(
  "/lista-medicacoes",
  (req, res) => {

    res.json([
      "Dipirona",
      "Paracetamol",
      "Ibuprofeno",
      "Amoxicilina",
      "Azitromicina",
      "Loratadina",
      "Omeprazol",
      "Buscopan",
      "Dramin",
      "Soro fisiológico"
    ]);

  }
);

// ===============================
// CONSULTA MÉDICA
// ===============================

app.post("/consulta", (req, res) => {

  const db = readDB();

  const consulta = {

    id: Date.now(),

    paciente:
      req.body.paciente || "",

    diagnostico:
      req.body.diagnostico || "",

    medicacao:
      req.body.medicacao || "",

    obs:
      req.body.obs || "",

    createdAt:
      new Date().toISOString()

  };

  db.consultas.push(consulta);

  writeDB(db);

  res.json(consulta);

});

// ===============================
// LISTAR CONSULTAS
// ===============================

app.get("/medicacoes", (req, res) => {

  const db = readDB();

  res.json(db.consultas);

});

// ===============================
// TESTE DA API
// ===============================

app.get("/api/status", (req, res) => {

  res.json({
    status: "online",
    servidor: "Hospital Auria",
    mensagem: "API funcionando corretamente"
  });

});

// ===============================
// PÁGINA PRINCIPAL
// ===============================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      FRONTEND_DIR,
      "index.html"
    )
  );

});

// ===============================
// INICIAR SERVIDOR
// ===============================

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Servidor rodando na porta ${PORT}`
    );

    console.log(
      "Banco:",
      DB_FILE
    );

  }
);
