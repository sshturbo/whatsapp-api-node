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

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar o sistema operacional
check_os() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        exit_with_error "Este script só suporta sistemas Linux."
    fi
}

# Limpa o terminal e mostra cabeçalho com informações do criador
clear
show_header

check_os

# Verifica se o Docker está instalado
if ! command_exists docker; then
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y docker.io >/dev/null 2>&1" "Instalando Docker"
    run_with_spinner "sudo systemctl start docker >/dev/null 2>&1" "Iniciando Docker"
    run_with_spinner "sudo systemctl enable docker >/dev/null 2>&1" "Habilitando inicialização automática do Docker"
else
    show_progress "Docker já está instalado"
fi

# Verifica se o Docker Compose está instalado
if ! command_exists docker-compose; then
    run_with_spinner "sudo apt install -y curl >/dev/null 2>&1" "Instalando curl (necessário para o Docker Compose)"
    run_with_spinner "sudo curl -L 'https://github.com/docker/compose/releases/download/$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -oP '(?<=\"tag_name\": \").*?(?=\")')/docker-compose-$(uname -s)-$(uname -m)' -o /usr/local/bin/docker-compose" "Baixando Docker Compose"
    run_with_spinner "sudo chmod +x /usr/local/bin/docker-compose" "Aplicando permissões ao Docker Compose"
else
    show_progress "Docker Compose já está instalado"
fi

# Verifica se o Node.js versão 20 está instalado
if ! command -v node &> /dev/null || ! node --version | grep -q "v20"; then
    run_with_spinner "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1" "Configurando repositório do Node.js"
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y nodejs >/dev/null 2>&1" "Instalando Node.js"
    run_with_spinner "sudo npm install -g pm2 >/dev/null 2>&1" "Instalando PM2"
else
    show_progress "Node.js 20 e PM2 já estão instalados"
fi


# Verifica e instala o utilitário unzip se necessário
if ! command_exists unzip; then
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y unzip >/dev/null 2>&1" "Instalando unzip"
else
    show_progress "unzip já está instalado"
fi

# Verifica e instala o OpenSSL se necessário
if ! command_exists openssl; then
    run_with_spinner "sudo apt update >/dev/null 2>&1" "Atualizando o apt"
    run_with_spinner "sudo apt install -y openssl >/dev/null 2>&1" "Instalando OpenSSL"
else
    show_progress "OpenSSL já está instalado"
fi

# Solicita ao usuário inserir a AUTHENTICATION_API_KEY
read -p "Insira a AUTHENTICATION_API_KEY: " AUTHENTICATION_API_KEY

# Solicita ao usuário inserir a porta e valida a entrada
while true; do
    read -p "Insira a porta para mapeamento (ex. 21444): " PORT
    if [[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -gt 0 ] && [ "$PORT" -le 65535 ]; then
        break
    else
        echo "Porta inválida. Por favor, insira um número entre 1 e 65535."
    fi
done

# Verifica se o contêiner Docker já está em execução e remove-o
if [ "$(docker ps -q -f name=evolution_v2)" ]; then
    run_with_spinner "docker stop evolution_v2 >/dev/null 2>&1" "Parando contêiner evolution_v2 existente"
    run_with_spinner "docker rm evolution_v2 >/dev/null 2>&1" "Removendo contêiner evolution_v2 existente"
fi
if [ "$(docker ps -q -f name=pgadmin)" ]; then
    run_with_spinner "docker stop pgadmin >/dev/null 2>&1" "Parando contêiner pgadmin existente"
    run_with_spinner "docker rm pgadmin >/dev/null 2>&1" "Removendo contêiner pgadmin existente"
fi
if [ "$(docker ps -q -f name=postgres_db)" ]; then
    run_with_spinner "docker stop postgres_db >/dev/null 2>&1" "Parando contêiner postgres_db existente"
    run_with_spinner "docker rm postgres_db >/dev/null 2>&1" "Removendo contêiner postgres_db existente"
fi
if [ "$(docker ps -q -f name=redis_service)" ]; then
    run_with_spinner "docker stop redis_service >/dev/null 2>&1" "Parando contêiner redis_service existente"
    run_with_spinner "docker rm redis_service >/dev/null 2>&1" "Removendo contêiner redis_service existente"
fi

# Verifica se o aplicativo PM2 já está em execução e remove-o
if pm2 list | grep -q "whats"; then
    run_with_spinner "pm2 stop whats >/dev/null 2>&1" "Parando aplicativo PM2 existente"
    run_with_spinner "pm2 delete whats >/dev/null 2>&1" "Removendo aplicativo PM2 existente"
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
sed -i "s|^PORT=.*|PORT=21468|" .env
sed -i "s|^SECRET_KEY=.*|SECRET_KEY=${SECRET_KEY}|" .env
sed -i "s|^API_KEY=.*|API_KEY=${AUTHENTICATION_API_KEY}|" .env
sed -i "s|^API_ENDPOINT=.*|API_ENDPOINT=http://localhost:${PORT}|" .env

run_with_spinner "npm install >/dev/null 2>&1" "Instalando dependências"
run_with_spinner "npm run build >/dev/null 2>&1" "Construindo aplicação"
run_with_spinner "npm start >/dev/null 2>&1" "Iniciando aplicação"

cd evolution || exit_with_error "Falha ao acessar diretório do repositório"

# Modifica o arquivo docker-compose.yml com a porta fornecida pelo usuário
show_progress "Modificando a porta da evolution para $PORT"
sed -i "s|8080:8080|$PORT:8080|" docker-compose.yml || exit_with_error "Falha ao modificar o docker-compose.yml"

# Adiciona a AUTHENTICATION_API_KEY no arquivo  docker-compose.yml
show_progress "Adicionando AUTHENTICATION_API_KEY no arquivo docker-compose.yml"
sed -i "s|AUTHENTICATION_API_KEY=cb8c87193f183f91a16e6eb697ca84ec|AUTHENTICATION_API_KEY=${AUTHENTICATION_API_KEY}|" docker-compose.yml || exit_with_error "Falha ao modificar o docker-compose.yml"

# Adiciona a POSTGRES_PASSWORD no arquivo  docker-compose.yml
show_progress "Adicionando POSTGRES_PASSWORD no arquivo docker-compose.yml"
sed -i "s|POSTGRES_PASSWORD: cb8c87193f183f91a16e6eb697ca84ec|POSTGRES_PASSWORD: ${AUTHENTICATION_API_KEY}|" docker-compose.yml || exit_with_error "Falha ao modificar o docker-compose.yml"

# Adiciona a PGADMIN_DEFAULT_PASSWORD no arquivo  docker-compose.yml
show_progress "Adicionando PGADMIN_DEFAULT_PASSWORD no arquivo  docker-compose.yml"
sed -i "s|PGADMIN_DEFAULT_PASSWORD: cb8c87193f183f91a16e6eb697ca84ec|PGADMIN_DEFAULT_PASSWORD: ${AUTHENTICATION_API_KEY}|" docker-compose.yml || exit_with_error "Falha ao modificar o docker-compose.yml"

# Adiciona a SERVER_URL no arquivo docker-compose.yml
show_progress "Adicionando SERVER_URL no arquivo docker-compose.yml"
sed -i "s|SERVER_URL=http://localhost:8080|SERVER_URL=http://localhost:$PORT|" docker-compose.yml || exit_with_error "Falha ao modificar o docker-compose.yml"

# Adiciona a DATABASE_CONNECTION_URI no arquivo docker-compose.yml
show_progress "Adicionando DATABASE_CONNECTION_URI no arquivo docker-compose.yml"
sed -i "s|DATABASE_CONNECTION_URI=postgresql://postgres:cb8c87193f183f91a16e6eb697ca84ec@postgres_db:5432/evolution|DATABASE_CONNECTION_URI=postgresql://postgres:${AUTHENTICATION_API_KEY}@postgres_db:5432/evolution|" docker-compose.yml || exit_with_error "Falha ao modificar o docker-compose.yml"

# Executa o Docker Compose para subir o contêiner
show_progress "Iniciando contêiner do evolutin"
docker-compose up -d >/dev/null 2>&1

IPV4=$(curl -s https://api.ipify.org)

echo "------------------------------------------"
echo "- Instalação concluída e aplicação iniciada"
echo""
echo"URL da api evolution: http:$IPV4:$PORT"
echo"URL da documentação da evolution: https://doc.evolution-api.com/v2/api-reference/get-information"
echo"URL da Painel de gerenciamento: http:$IPV4:21468"
echo""
echo "------------------------------------------"
