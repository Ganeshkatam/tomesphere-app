namespace GakaVoiceService;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;

    public Worker(ILogger<Worker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Hey GaKa Windows Service running at: {time}", DateTimeOffset.Now);

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
               // In a real implementation, Picovoice Porcupine logic would go here.
               // It would listen to the microphone stream for the wake word.
               // _logger.LogInformation("Listening for 'Hey GaKa'..."); 
            }

            // Simulating listening loop
            await Task.Delay(1000, stoppingToken);
        }
    }
}
