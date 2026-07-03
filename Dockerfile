# =========================================================
# ESTÁGIO 1: Build do Frontend (Vite + React)
# =========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copia os arquivos de dependências para aproveitar o cache de camadas do Docker
COPY package.json package-lock.json* ./

# Instala todas as dependências de forma limpa e otimizada
RUN npm ci || npm install

# Copia os arquivos necessários do frontend (configurações e código fonte)
COPY vite.config.ts tsconfig.json index.html ./
COPY src/ ./src/

# Executa o build de produção (gera a pasta /app/dist)
RUN npm run build

# =========================================================
# ESTÁGIO 2: Build do Backend (Spring Boot + Maven)
# =========================================================
FROM maven:3.9.6-eclipse-temurin-21 AS backend-builder
WORKDIR /app/backend

# Copia o arquivo pom.xml para baixar as dependências do Maven primeiro e cachear essa etapa
COPY backend/pom.xml ./

# Baixa as dependências offline (otimização de cache para builds subsequentes)
RUN mvn dependency:go-offline -B

# Copia o código fonte do backend
COPY backend/src/ ./src/

# Copia o build estático do Frontend gerado no Estágio 1 para os recursos estáticos do Spring Boot
# Garantindo que a pasta exista antes de copiar
RUN mkdir -p src/main/resources/static
COPY --from=frontend-builder /app/dist/ src/main/resources/static/

# Compila e empacota o backend gerando o arquivo .jar (ignora testes para acelerar o deploy)
RUN mvn clean package -DskipTests -B

# =========================================================
# ESTÁGIO 3: Ambiente de Execução Ultra Light (JRE 21)
# =========================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cria um usuário não-root por questões de segurança
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copia apenas o .jar compilado do estágio anterior para o ambiente final
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Define variáveis de ambiente padrão do Spring Boot para produção
ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080

# Expõe a porta em que a aplicação unificada irá rodar
EXPOSE 8080

# Comando para iniciar o servidor Spring Boot integrado com o frontend
ENTRYPOINT ["java", "-jar", "app.jar"]