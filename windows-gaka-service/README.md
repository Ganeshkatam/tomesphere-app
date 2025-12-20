# Hey GaKa Windows Service (.NET)

This is a background Worker Service that runs alongside the TomeSphere Windows App to listen for the "Hey GaKa" wake word globally.

## Prerequisites
- **.NET SDK 8.0** or higher.

## How to Build & Run
1. Open a terminal in this directory (`windows-gaka-service`).
2. Run the service:
   ```bash
   dotnet run
   ```
   *Code will start listening (simulated loop currently).*

## Development
- Edit `Worker.cs` to integrate the real Picovoice Porcupine logic.
- The service logs "Listening..." to the console/debug output.
