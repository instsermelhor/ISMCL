export class EncryptionService {
  async encrypt(text: string, options: any): Promise<string> {
    return Buffer.from(text).toString('base64'); // Mock implementation
  }
}
