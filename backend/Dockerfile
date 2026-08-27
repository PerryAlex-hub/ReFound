# ReFound API — multi-stage build.
#
# Java is not one of Render's native runtimes, so the service is deployed as a
# container. This also pins the JDK, which means the build is identical on every
# developer machine and on the host.
#
# Two stages: the first compiles with a full JDK, the second ships only the JRE
# and the jar. The build tooling and the Maven cache never reach the running
# image — it is roughly a third of the size and has far less in it to attack.

# ---------------------------------------------------------------- build stage
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /build

# Dependencies first, in their own layer. pom.xml changes rarely; source changes
# constantly. Ordering it this way means an ordinary code change reuses the
# cached dependency download instead of pulling ~65MB of jars again.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -DskipTests clean package

# ----------------------------------------------------------------- run stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Don't run as root. If the process is ever compromised, it should not own the
# filesystem it is running on.
RUN addgroup -S refound && adduser -S refound -G refound
USER refound

COPY --from=build /build/target/api-0.0.1-SNAPSHOT.jar app.jar

# Documentation only — the platform injects the real PORT at runtime and the
# app binds to it (see server.port in application.yml).
EXPOSE 8080

# Container-aware heap sizing. Left to itself the JVM reads the host's total
# memory rather than the container limit and gets OOM-killed under load; this
# caps the heap at 75% of whatever the container is actually given.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
