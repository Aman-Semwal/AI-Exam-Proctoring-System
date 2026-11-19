# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml first and resolve all dependencies into the Docker layer cache.
# This layer is only invalidated when pom.xml changes — not on every source edit.
# --retry-failed-downloads retries transient 502/network errors automatically.
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Now copy source and build. Dependencies are already cached in the layer above.
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Run
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]
