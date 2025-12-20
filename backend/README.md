# Hey GaKa Backend (Java Spring Boot)

This is the centralized brain for the TomeSphere Voice System. It uses Spring AI to process voice intents and map them to application features.

## Prerequisites
- **Java 17** or higher.
- **Maven** (installed and added to PATH).
- **Supabase Account** (for pgvector knowledge base).
- **Gemini API Key** (for AI processing).

## Configuration
Open `src/main/resources/application.properties` and update the following placeholders:

```properties
spring.ai.vertex.ai.gemini.project-id=YOUR_PROJECT_ID
spring.ai.vertex.ai.gemini.api-key=YOUR_API_KEY
spring.datasource.url=jdbc:postgresql://YOUR_SUPABASE_HOST:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=YOUR_Available_DB_PASSWORD
```

## How to Run
1. Open a terminal in this directory (`backend`).
2. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   *Alternative: `mvn clean package` then `java -jar target/backend-0.0.1-SNAPSHOT.jar`*

## How it Works
- On startup, `CsvIngestorService` reads `../gaka_feature_mapping.csv` and updates the vector database.
- The intent API is available at: `POST http://localhost:8080/api/v1/gaka/intent`
