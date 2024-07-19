# whatsapp-api-node
whatsapp-api-node e um site de gerenciamento da api evolution, onde pode ta gerando o qrcode para conectar ao whatsapp

## Pré-requisitos

O projeiro usa:

 - NodeJs
 - docker
 - bcrypt
 - dotenv
 - ejs
 - express
 - express-session
 - fs
 - randomstring
 - sqlite3
 - uuid
 - validator

## Instalação

Para instalar siga estas etapas:

para poder geara um hash aleatorio:

```bash
openssl rand -base64 32 | sha256sum
```

```bash
bash <(wget -qO- https://raw.githubusercontent.com/sshturbo/whatsapp-api-node/main/install.sh)
```

Verificar se está instalado e executado com sucesso só executar o comando.

```bash
pm2 status
```

Para poder tá parando e só executar o comando.

```bash
pm2 stop whats
```

Para poder ta iniciando e so executar o comando.

```bash
pm2 start whats
```

Para poder ta deletando e so executar o comando.

```bash
pm2 delete whats
```