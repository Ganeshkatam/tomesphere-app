export class VoiceCommands {
    recognizeSpeech(): Promise<string> {
        return new Promise((resolve) => {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new (window as any).webkitSpeechRecognition();
                recognition.onresult = (event: any) => {
                    resolve(event.results[0][0].transcript);
                };
                recognition.start();
            } else {
                resolve('');
            }
        });
    }

    executeCommand(command: string): void {
        const lowerCommand = command.toLowerCase();

        if (lowerCommand.includes('search')) {
            console.log('Opening search');
        } else if (lowerCommand.includes('next page')) {
            console.log('Next page');
        } else if (lowerCommand.includes('bookmark')) {
            console.log('Adding bookmark');
        }
    }
}

export const voiceCommands = new VoiceCommands();
