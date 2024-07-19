#!/bin/bash

# Função para limpar a tela e exibir cabeçalho
show_header() {
    clear
    echo "-----------------------------------------------------"
    echo "|           Instalação da Api Evolution              |"
    echo "|       Script criado por: Jefferson Hipólito.       |"
    echo "-----------------------------------------------------"
    echo
}

# Função para exibir mensagem de progresso
show_progress() {
    echo "------------------------------------------"
    echo "- $1"
    echo "------------------------------------------"
}

# Função para exibir mensagem de erro e sair com código de erro
exit_with_error() {
    echo "Erro: $1"
    exit 1
}

# Limpa o terminal e mostra cabeçalho com informações do criador
clear
show_header

# Verifica se o Docker está instalado
docker --version >/dev/null 2>&1
DOCKER_INSTALLED=$?
if [ $DOCKER_INSTALLED -ne 0 ]; then
    show_progress "Instalando Docker"
    sudo apt update >/dev/null 2>&1 || exit_with_error "Falha ao atualizar o apt"
    sudo apt install -y docker.io >/dev/null 2>&1 || exit_with_error "Falha ao instalar Docker"
    sudo systemctl start docker >/dev/null 2>&1 || exit_with_error "Falha ao iniciar Docker"
    sudo systemctl enable docker >/dev/null 2>&1 || exit_with_error "Falha ao habilitar inicialização automática do Docker"
else
    show_progress "Docker já está instalado"
fi

# Verifica se o Node.js versão 20 está instalado
node --version | grep "v20" >/dev/null 2>&1
NODE_INSTALLED=$?
if [ $NODE_INSTALLED -ne 0 ]; then
    show_progress "Instalando Node.js 20 e PM2"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1 || exit_with_error "Falha ao configurar o repositório do Node.js"
    sudo apt update >/dev/null 2>&1 || exit_with_error "Falha ao atualizar o apt"
    sudo apt install -y nodejs >/dev/null 2>&1 || exit_with_error "Falha ao instalar Node.js"
    sudo npm install -g pm2 >/dev/null 2>&1 || exit_with_error "Falha ao instalar PM2"
else
    show_progress "Node.js 20 e PM2 já estão instalados"
fi

# Verifica e instala o utilitário unzip se necessário
if ! command -v unzip &>/dev/null; then
    show_progress "Instalando unzip"
    sudo apt update >/dev/null 2>&1 || exit_with_error "Falha ao atualizar o apt"
    sudo apt install -y unzip >/dev/null 2>&1 || exit_with_error "Falha ao instalar unzip"
else
    show_progress "unzip já está instalado"
fi

# Verifica e instala o OpenSSL se necessário
if ! command -v openssl &>/dev/null; then
    show_progress "Instalando OpenSSL"
    sudo apt update >/dev/null 2>&1 || exit_with_error "Falha ao atualizar o apt"
    sudo apt install -y openssl >/dev/null 2>&1 || exit_with_error "Falha ao instalar OpenSSL"
else
    show_progress "OpenSSL já está instalado"
fi

# Solicita ao usuário inserir a AUTHENTICATION_API_KEY
read -p "Insira a AUTHENTICATION_API_KEY: " AUTHENTICATION_API_KEY

# Solicita ao usuário inserir a porta
read -p "Insira a porta para mapeamento (ex. 21444): " PORT

# Verifica se o contêiner Docker já está em execução e remove-o
if [ $(docker ps -q -f name=whats-webhostpro) ]; then
    show_progress "Parando e removendo contêiner Docker existente"
    docker stop whats-webhostpro || exit_with_error "Falha ao parar contêiner Docker existente"
    docker rm whats-webhostpro || exit_with_error "Falha ao remover contêiner Docker existente"
fi

# Executa o comando Docker com os parâmetros fornecidos pelo usuário
show_progress "Executando o contêiner Docker"
docker run -d \
    --name whats-webhostpro \
    --restart always \
    -p "$PORT":8080 \
    -e AUTHENTICATION_API_KEY="$AUTHENTICATION_API_KEY" \
    -v evolution_store:/evolution/store \
    -v evolution_instances:/evolution/instances \
    atendai/evolution-api || exit_with_error "Falha ao executar o contêiner Docker"

# Verifica se o aplicativo PM2 já está em execução e remove-o
if pm2 list | grep -q "whatsapp-api"; then
    show_progress "Parando e removendo aplicativo PM2 existente"
    pm2 stop whatsapp-api || exit_with_error "Falha ao parar aplicativo PM2 existente"
    pm2 delete whatsapp-api || exit_with_error "Falha ao remover aplicativo PM2 existente"
fi

# Verifica se o diretório do projeto já existe e remove-o
if [ -d "whatsapp-api-node" ]; then
    show_progress "Removendo diretório do projeto existente"
    rm -rf whatsapp-api-node || exit_with_error "Falha ao remover diretório do projeto existente"
fi

show_progress "Clonando repositório"
git clone https://github.com/sshturbo/whatsapp-api-node.git || exit_with_error "Falha ao clonar repositório"
cd whatsapp-api-node || exit_with_error "Falha ao acessar diretório do repositório"

show_progress "Configurando arquivo .env"
cp exemple.env .env || exit_with_error "Falha ao copiar arquivo exemple.env"
SECRET_KEY=$(openssl rand -base64 32)
sed -i "s/^PORT=.*/PORT=21468/" .env
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=${SECRET_KEY}/" .env
sed -i "s/^API_KEY=.*/API_KEY=${AUTHENTICATION_API_KEY}/" .env
sed -i "s|^API_ENDPOINT=.*|API_ENDPOINT=http://localhost:${PORT}|" .env

show_progress "Instalando dependências"
npm install || exit_with_error "Falha ao instalar dependências"

show_progress "Construindo aplicação"
npm run build || exit_with_error "Falha ao construir aplicação"

show_progress "Iniciando aplicação"
pm2 start npm --name "whatsapp-api" -- start || exit_with_error "Falha ao iniciar aplicação"

echo "------------------------------------------"
echo "- Instalação concluída e aplicação iniciada"
echo "------------------------------------------"

