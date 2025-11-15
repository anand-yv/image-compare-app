# build stage (Maven + JDK 17)
FROM maven:3.9.2-eclipse-temurin-17 AS build
WORKDIR /app

# copy maven wrapper & pom early to cache deps
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# prepare dependencies
RUN chmod +x mvnw
RUN ./mvnw -q -N dependency:go-offline

# copy source and build
COPY src ./src
RUN ./mvnw -DskipTests -Dmaven.compiler.release=17 package

# run stage (slim JRE)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose the port your Spring Boot app uses
EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
