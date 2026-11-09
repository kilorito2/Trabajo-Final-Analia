# syntax=docker/dockerfile:1

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
# Primero solo lo necesario para bajar dependencias: esta capa queda en caché mientras no cambie
# el pom.xml.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
# Única excepción a la regla de no saltear tests: acá no hay Docker para Testcontainers. Los tests
# corren en ./mvnw verify y en CI.
RUN ./mvnw -B -q package -DskipTests \
    && cp target/*.jar app.jar \
    && java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extraido

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system farmacia && useradd --system --gid farmacia --home /app farmacia
COPY --from=build /app/extraido/dependencies/ ./
COPY --from=build /app/extraido/spring-boot-loader/ ./
COPY --from=build /app/extraido/snapshot-dependencies/ ./
COPY --from=build /app/extraido/application/ ./
USER farmacia
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
