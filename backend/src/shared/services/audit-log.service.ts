export class AuditLogService {
  async logStrict(data: any): Promise<void> {
    console.log('AUDIT LOG:', data);
  }
}
