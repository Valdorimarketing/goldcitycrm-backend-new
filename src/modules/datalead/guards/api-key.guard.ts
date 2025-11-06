import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest(); 

    const apiKey = request.query.key;
    const apiSecret = request.query.secret;

    if (!apiKey || !apiSecret) {
      throw new UnauthorizedException('API key or secret is missing.');
    }

    const isValid = await this.apiKeyService.validateKey(apiKey, apiSecret);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API credentials.');
    }

    return true;
  }
}
