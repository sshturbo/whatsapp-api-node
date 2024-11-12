const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const validator = require('validator');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const randomstring = require('randomstring');

const app = express();
const port = process.env.PORT || 21468;


const dbDir = path.join(__dirname, '../database');
const dbPath = path.join(dbDir, 'app.db');

const initDb = () => {
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            return console.error('Erro ao abrir ou criar o banco de dados:', err.message);
        }
        console.log('Conectado ao banco de dados SQLite.');

        db.serialize(() => {

            db.run(`
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    senha TEXT NOT NULL,
                    nivel INTEGER DEFAULT 2
                )
            `);


            db.run(`
                CREATE TABLE IF NOT EXISTS whatsapp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    byid INTEGER NOT NULL,
                    token TEXT NOT NULL,
                    instancia TEXT NOT NULL,
                    numero TEXT NOT NULL,
                    status TEXT,
                    FOREIGN KEY (byid) REFERENCES accounts (id)
                )
            `);
        });

        db.close((err) => {
            if (err) {
                return console.error('Erro ao fechar o banco de dados:', err.message);
            }
            console.log('Conexão ao banco de dados SQLite fechada.');
        });
    });
};


initDb();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));


app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


app.use(express.static(path.join(__dirname, '../public')));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const verificarSessao = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    next();
};

app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const db = new sqlite3.Database(dbPath);

    if (!email || !senha) {
        return res.redirect('/?tipo=erro&msg=Todos%20os%20campos%20s%C3%A3o%20obrigat%C3%B3rios.');
    }

    db.get(`
        SELECT * FROM accounts WHERE email = ?
    `, [email], async (err, row) => {
        if (err) {
            return res.redirect('/?tipo=erro&msg=Erro%20ao%20buscar%20usu%C3%A1rio.');
        }

        if (!row) {
            return res.redirect('/?tipo=erro&msg=Email%20ou%20senha%20incorretos.');
        }


        const match = await bcrypt.compare(senha, row.senha);
        if (!match) {
            return res.redirect('/?tipo=erro&msg=Email%20ou%20senha%20incorretos.');
        }

        req.session.usuario = {
            id: row.id,
            nome: row.nome,
            email: row.email,
            nivel: row.nivel
        };

        res.redirect('/home');
    });

    db.close();
});


app.get('/cadastrar', (req, res) => {
    res.render('cadastrar');
});


app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    const db = new sqlite3.Database(dbPath);

    try {
        if (!nome || !email || !senha) {
            return res.redirect('/cadastrar?tipo=erro&msg=Todos%20os%20campos%20s%C3%A3o%20obrigat%C3%B3rios.');
        }

        if (!validator.isEmail(email)) {
            return res.redirect('/cadastrar?tipo=erro&msg=Email%20inv%C3%A1lido.');
        }

        const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!senhaForte.test(senha)) {
            return res.redirect('/cadastrar?tipo=erro&msg=A%20senha%20deve%20ter%20pelo%20menos%208%20caracteres%2C%20uma%20letra%20mai%C3%BAscula%2C%20uma%20letra%20min%C3%BAscula%2C%20um%20n%C3%BAmero%20e%20um%20caractere%20especial.');
        }

        const hashedSenha = await bcrypt.hash(senha, 10);

        db.run(`
            INSERT INTO accounts (nome, email, senha)
            VALUES (?, ?, ?)
        `, [nome, email, hashedSenha], (err) => {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.redirect('/cadastrar?tipo=erro&msg=Email%20j%C3%A1%20cadastrado.');
                }
                return res.redirect('/cadastrar?tipo=erro&msg=Erro%20ao%20cadastrar%20usu%C3%A1rio.');
            }
            res.redirect('/cadastrar?tipo=sucesso&msg=Usu%C3%A1rio%20cadastrado%20com%20sucesso!');
        });
    } catch (err) {
        res.redirect('/cadastrar?tipo=erro&msg=Erro%20ao%20cadastrar%20usu%C3%A1rio.');
    } finally {
        db.close();
    }
});

app.get('/home', verificarSessao, (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const { nome, email, nivel } = req.session.usuario;

    res.render('home', { nome, email, nivel });
});


app.get('/sessoes', verificarSessao, (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const { nome, email, nivel } = req.session.usuario;

    res.render('sessoes', { nome, email, nivel });
});


app.get('/perfil', verificarSessao, (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const { nome, email, nivel } = req.session.usuario;

    res.render('perfil', { nome, email, nivel });
});

app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao encerrar sessão.');
        }
        res.redirect('/');
    });
});

app.get('/dados-whatsapp', verificarSessao, (req, res) => {
    const { id } = req.session.usuario;
    const db = new sqlite3.Database(dbPath);

    db.get(`
        SELECT id, byid, token, status, instancia, numero
        FROM whatsapp
        WHERE byid = ?
    `, [id], (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Erro ao buscar dados do WhatsApp.' });
        }

        if (!row) {
            db.close();
            return res.status(404).json({ error: 'Dados do WhatsApp não encontrados para o usuário.' });
        }

        const dadosWhatsApp = {
            id: row.id,
            byid: row.byid,
            token: row.token,
            status: row.status,
            instancia: row.instancia,
            numero: row.numero
        };

        db.close();
        res.json({ dados: dadosWhatsApp });
    });
});

app.get('/dados-usuario', verificarSessao, (req, res) => {
    const { nome, email } = req.session.usuario;
    res.json({ nome, email });
});

app.get('/estatisticas', verificarSessao, (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const { id } = req.session.usuario;

    let estatisticas = {};

    db.get(`
        SELECT COUNT(*) AS quantidadeUsuarios
        FROM accounts
    `, (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Erro ao buscar quantidade de usuários cadastrados.' });
        }
        estatisticas.quantidadeUsuarios = row.quantidadeUsuarios;

        db.get(`
            SELECT COUNT(*) AS quantidadeInstancias
            FROM whatsapp
        `, (err, row) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Erro ao buscar quantidade de instâncias cadastradas.' });
            }
            estatisticas.quantidadeInstancias = row.quantidadeInstancias;

            db.get(`
                SELECT COUNT(*) AS quantidadeInstanciasUsuario
                FROM whatsapp
                WHERE byid = ?
            `, [id], (err, row) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Erro ao buscar quantidade de instâncias cadastradas pelo usuário.' });
                }
                estatisticas.quantidadeInstanciasUsuario = row.quantidadeInstanciasUsuario;

                db.close();
                res.json(estatisticas);
            });
        });
    });
});

app.post('/atualizar', verificarSessao, async (req, res) => {
    const { nome, email, senha } = req.body;
    const { id } = req.session.usuario;

    const validarEmail = (email) => {
        if (!validator.isEmail(email)) {
            return false;
        }
        return true;
    };

    const validarSenhaForte = (senha) => {
        const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return senhaForte.test(senha);
    };

    const db = new sqlite3.Database(dbPath);

    try {
        if (!nome && !email && !senha) {
            return res.redirect('/perfil?tipo=erro&msg=Nenhuma%20informa%C3%A7%C3%A3o%20foi%20fornecida%20para%20atualiza%C3%A7%C3%A3o.');
        }

        if (email && !validarEmail(email)) {
            return res.redirect('/perfil?tipo=erro&msg=Email%20inv%C3%A1lido.');
        }

        if (senha && !validarSenhaForte(senha)) {
            return res.redirect('/perfil?tipo=erro&msg=A%20senha%20deve%20ter%20pelo%20menos%208%20caracteres%2C%20uma%20letra%20mai%C3%BAscula%2C%20uma%20letra%20min%C3%BAscula%2C%20um%20n%C3%BAmero%20e%20um%20caractere%20especial.');
        }

        db.get(`
            SELECT nome, email, senha
            FROM accounts
            WHERE id = ?
        `, [id], async (err, row) => {
            if (err) {
                console.error('Erro ao buscar dados atuais do usuário:', err);
                db.close();
                return res.redirect('/perfil?tipo=erro&msg=Erro%20ao%20buscar%20dados%20atuais%20do%20usu%C3%A1rio.');
            }

            if (nome === row.nome && email === row.email && (!senha || (senha && await bcrypt.compare(senha, row.senha)))) {
                db.close();
                return res.redirect('/perfil?tipo=erro&msg=As%20informa%C3%A7%C3%B5es%20enviadas%20s%C3%A3o%20iguais%20%C3%A0s%20atuais.%20Nenhuma%20atualiza%C3%A7%C3%A3o%20foi%20feita.');
            }

            let query = 'UPDATE accounts SET ';
            const params = [];

            if (nome && nome !== row.nome) {
                query += 'nome = ?, ';
                params.push(nome);
            }

            if (email && email !== row.email) {
                query += 'email = ?, ';
                params.push(email);
            }

            if (senha) {
                const hashedSenha = await bcrypt.hash(senha, 10);
                query += 'senha = ?, ';
                params.push(hashedSenha);
            }

            query = query.slice(0, -2);

            query += ' WHERE id = ?';
            params.push(id);

            db.run(query, params, async (err) => {
                if (err) {
                    console.error('Erro ao atualizar usuário:', err);
                    db.close();
                    return res.redirect('/perfil?tipo=erro&msg=Erro%20ao%20atualizar%20as%20informa%C3%A7%C3%B5es.');
                }

                req.session.destroy((err) => {
                    if (err) {
                        db.close();
                        return res.status(500).send('Erro ao encerrar sessão.');
                    }

                    db.close();
                    res.redirect('/sair');
                });
            });
        });
    } catch (err) {
        console.error('Erro ao processar atualização:', err);
        res.redirect('/perfil?tipo=erro&msg=Erro%20ao%20processar%20a%20atualiza%C3%A7%C3%A3o.');
    }
});

const gerarToken = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 20; i++) {
        token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return token;
};

app.post('/criar-instancia-whatsapp', verificarSessao, async (req, res) => {
    const { numero } = req.body;

    const regexNumero = /^(\+55)?(55)?(?:[1-9][0-9])?[0-9]{8,9}$/;
    if (!regexNumero.test(numero)) {
        return res.status(400).json({ error: 'Número de telefone inválido.' });
    }

    const db = new sqlite3.Database(dbPath);
    const { id } = req.session.usuario;

    db.get(`
        SELECT * FROM whatsapp WHERE byid = ?
    `, [id], async (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Erro ao buscar instância do WhatsApp.' });
        }

        if (row) {
            db.close();
            return res.status(400).json({ error: 'Você já possui uma instância do WhatsApp criada.' });
        }

        const nomeInstancia = `instancia_${Math.random().toString(36).substring(7)}`;

        const token = gerarToken();


        const status = 'desconectado';


        const body = {
            number: numero,
            token: token,
            instanceName: nomeInstancia,
            syncFullHistory: true,
            readStatus: true,
            readMessages: true,
            alwaysOnline: true,
            groupsIgnore: false,
            reject_call: false,
            alwaysOnline: true,
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true
        };

        const options = {
            method: 'POST',
            headers: {
                apikey: process.env.API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        try {
            const response = await fetch(`${process.env.API_ENDPOINT}/instance/create`, options);
            const data = await response.json();

            db.run(`
                INSERT INTO whatsapp (byid, token, instancia, numero, status)
                VALUES (?, ?, ?, ?, ?)
            `, [id, token, nomeInstancia, numero, status], (err) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Erro ao inserir dados no banco de dados.' });
                }

                db.close();
                res.json(data);
            });
        } catch (error) {
            console.error('Erro ao criar instância do WhatsApp:', error);
            res.status(500).json({ error: 'Erro ao criar instância do WhatsApp.' });
        }
    });
});

app.post('/conectar-whatsapp', verificarSessao, async (req, res) => {
    const { token, numero, instancia } = req.body;

    const url = `${process.env.API_ENDPOINT}/instance/connect/${instancia}?number=${numero}`;

    const options = {
        method: 'GET',
        headers: {
            apikey: token
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        const { instance } = data;
        if (instance && instance.state === 'open') {
            return res.json({ message: 'WhatsApp já foi conectado com sucesso!' });
        }

        const { pairingCode, base64 } = data;

        const base64WithoutPrefix = base64.replace(/^data:image\/png;base64,/, '');

        res.json({ pairingCode, base64: base64WithoutPrefix });
    } catch (error) {
        console.error('Erro ao conectar no WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao conectar no WhatsApp.' });
    }
});


app.post('/verificar-conexao-whatsapp', verificarSessao, async (req, res) => {
    const { token, instancia } = req.body;

    const url = `${process.env.API_ENDPOINT}/instance/connectionState/${instancia}`;

    const options = {
        method: 'GET',
        headers: {
            apikey: token
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        const { instance } = data;
        if (!instance) {
            return res.status(404).json({ error: 'Instância não encontrada.' });
        }

        const { state } = instance;

        const db = new sqlite3.Database(dbPath);
        const { id } = req.session.usuario;

        const novoStatus = (state === 'open') ? 'conectado' : 'desconectado';

        db.run(`
            UPDATE whatsapp
            SET status = ?
            WHERE byid = ? AND instancia = ?
        `, [novoStatus, id, instancia], (err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar status no banco de dados.' });
            }

            if (state === 'open') {
                res.status(200).json({ mensagem: 'Whatsapp conectado com sucesso!' });
            } else {
                res.status(200).json({ mensagem: 'Whatsapp desconectado.' });
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar conexão do WhatsApp.' });
    }
});

app.post('/excluir-instancia-whatsapp', verificarSessao, async (req, res) => {
    const { token, instancia } = req.body;

    console.log(`Dados recebidos: token=${token}, instancia=${instancia}`);

    const optionsLogout = {
        method: 'DELETE',
        headers: {
            apikey: token
        }
    };

    const optionsExcluir = {
        method: 'DELETE',
        headers: {
            apikey: token
        }
    };

    try {
        const urlLogout = `${process.env.API_ENDPOINT}/instance/logout/${instancia}`;
        const responseLogout = await fetch(urlLogout, optionsLogout);
        const dataLogout = await responseLogout.json();

        console.log('Resposta do logout:', dataLogout);

        if ((responseLogout.status === 404 || responseLogout.status === 400) && dataLogout.error === 'Bad Request' && dataLogout.response && dataLogout.response.message.includes("is not connected")) {

        } else if (!responseLogout.ok && responseLogout.status !== 404 && responseLogout.status !== 400) {

            throw new Error('Erro ao fazer logout da instância do WhatsApp.');
        }

        if ((responseLogout.status !== 404 && responseLogout.status !== 400) || dataLogout.response.message.includes("is not connected")) {
            const urlExcluir = `${process.env.API_ENDPOINT}/instance/delete/${instancia}`;
            const responseExcluir = await fetch(urlExcluir, optionsExcluir);
            const dataExcluir = await responseExcluir.json();

            console.log('Resposta da exclusão:', dataExcluir);


            if (!responseExcluir.ok) {
                throw new Error('Erro ao excluir instância do WhatsApp.');
            }
        }

        const db = new sqlite3.Database(dbPath);
        const { id } = req.session.usuario;

        db.run(`
            DELETE FROM whatsapp
            WHERE byid = ? AND instancia = ?
        `, [id, instancia], (err) => {
            db.close();
            if (err) {
                console.error('Erro ao excluir dados do banco de dados:', err);
                return res.status(500).json({ error: 'Erro ao excluir dados do banco de dados.' });
            }
            res.json({ message: 'Instância do WhatsApp excluída com sucesso.' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir instância do WhatsApp.' });
    }
});


app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
