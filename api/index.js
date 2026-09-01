```js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// CONFIGURAÇÕES
app.use(express.json());
app.use(cors());

// SERVIR O FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// BANCO DE DADOS
const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    console.error("Erro ao ler o banco de dados:", error);

    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Erro ao salvar o banco de dados:", error);
  }
}

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {
  const db = readDB();

  const { usuario, senha } = req.body;

  const user = db.usuarios.find(
    u =>
      u.usuario === usuario &&
      u.senha === senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// ===============================
// ATENDIMENTO
// ===============================

app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
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

  const temperatura = Number(req.body.temperatura);

  if (temperatura >= 39) {
    risco = "vermelho";
  } else if (temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco: risco,
    status: "aguardando_medico",
    createdAt: new Date().toISOString()
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

app.get("/lista-medicacoes", (req, res) => {
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
});

// ===============================
// CONSULTA MÉDICA
// ===============================

app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date().toISOString()
  };

  db.consultas.push(consulta);

  writeDB(db);

  res.json(consulta);
});

// ===============================
// LISTAR MEDICAÇÕES / CONSULTAS
// ===============================

app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(db.consultas);
});

// ===============================
// ROTA PRINCIPAL
// ===============================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

// ===============================
// INICIAR SERVIDOR
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```
