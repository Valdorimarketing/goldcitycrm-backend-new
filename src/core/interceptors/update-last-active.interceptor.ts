// core/interceptors/update-last-active.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs'; 
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class UpdateLastActiveInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req.user?.id) {
      this.userService.updateLastActiveTime(req.user.id).catch(console.error);
    }
    return next.handle();
  }
}
