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

# Função para exibir spinner de carregamento
show_spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Função para executar comandos com spinner
run_with_spinner() {
    local command=$1
    local message=$2

    show_progress "$message"
    eval $command &
    local pid=$!
    show_spinner $pid
    wait $pid
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        exit_with_error "$message falhou"
    fi
}

# Limpa o terminal e mostra cabeçalho com informações do criador
clear
show_header

# Verifica se o Docker está instalado
docker --version >/dev/null 2>&1
DOCKER_INSTALLED=$?
if [ $DOCKER_INSTALLED -ne 0 ]; then
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y docker.io >/dev/null 2>&1" "Instalando Docker"
    run_with_spinner "sudo systemctl start docker >/dev/null 2>&1" "Iniciando Docker"
    run_with_spinner "sudo systemctl enable docker >/dev/null 2>&1" "Habilitando inicialização automática do Docker"
else
    show_progress "Docker já está instalado"
fi

# Verifica se o Node.js versão 20 está instalado
node --version | grep "v20" >/dev/null 2>&1
NODE_INSTALLED=$?
if [ $NODE_INSTALLED -ne 0 ]; then
    run_with_spinner "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1" "Configurando repositório do Node.js"
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y nodejs >/dev/null 2>&1" "Instalando Node.js"
    run_with_spinner "sudo npm install -g pm2 >/dev/null 2>&1" "Instalando PM2"
else
    show_progress "Node.js 20 e PM2 já estão instalados"
fi

# Verifica e instala o utilitário unzip se necessário
if ! command -v unzip &>/dev/null; then
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y unzip >/dev/null 2>&1" "Instalando unzip"
else
    show_progress "unzip já está instalado"
fi

# Verifica e instala o OpenSSL se necessário
if ! command -v openssl &>/dev/null; then
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y openssl >/dev/null 2>&1" "Instalando OpenSSL"
else
    show_progress "OpenSSL já está instalado"
fi

# Solicita ao usuário inserir a AUTHENTICATION_API_KEY
read -p "Insira a AUTHENTICATION_API_KEY: " AUTHENTICATION_API_KEY

# Solicita ao usuário inserir a porta
read -p "Insira a porta para mapeamento (ex. 21444): " PORT

# Verifica se o contêiner Docker já está em execução e remove-o
if [ $(docker ps -q -f name=whats-webhostpro) ]; then
    run_with_spinner "docker stop whats-webhostpro >/dev/null 2>&1" "Parando contêiner Docker existente"
    run_with_spinner "docker rm whats-webhostpro >/dev/null 2>&1" "Removendo contêiner Docker existente"
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
    atendai/evolution-api >/dev/null 2>&1 &
pid=$!
show_spinner $pid
wait $pid
if [ $? -ne 0 ]; then
    exit_with_error "Falha ao executar o contêiner Docker"
fi

# Verifica se o aplicativo PM2 já está em execução e remove-o
if pm2 list | grep -q "whatsapp-api"; then
    run_with_spinner "pm2 stop whatsapp-api >/dev/null 2>&1" "Parando aplicativo PM2 existente"
    run_with_spinner "pm2 delete whatsapp-api >/dev/null 2>&1" "Removendo aplicativo PM2 existente"
fi

# Verifica se o diretório do projeto já existe e remove-o
if [ -d "whatsapp-api-node" ]; then
    run_with_spinner "rm -rf whatsapp-api-node" "Removendo diretório do projeto existente"
fi

run_with_spinner "git clone https://github.com/sshturbo/whatsapp-api-node.git >/dev/null 2>&1" "Clonando repositório"
cd whatsapp-api-node || exit_with_error "Falha ao acessar diretório do repositório"

show_progress "Configurando arquivo .env"
cp exemple.env .env || exit_with_error "Falha ao copiar arquivo exemple.env"
SECRET_KEY=$(openssl rand -base64 32)
sed -i "s/^PORT=.*/PORT=21468/" .env
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=${SECRET_KEY}/" .env
sed -i "s/^API_KEY=.*/API_KEY=${AUTHENTICATION_API_KEY}/" .env
sed -i "s|^API_ENDPOINT=.*|API_ENDPOINT=http://localhost:${PORT}|" .env

run_with_spinner "npm install >/dev/null 2>&1" "Instalando dependências"
run_with_spinner "npm run build >/dev/null 2>&1" "Construindo aplicação"
run_with_spinner "pm2 start npm --name 'whatsapp-api' -- start >/dev/null 2>&1" "Iniciando aplicação"

echo "------------------------------------------"
echo "- Instalação concluída e aplicação iniciada"
echo "------------------------------------------"
