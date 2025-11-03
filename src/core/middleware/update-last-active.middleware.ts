import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs'; 
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class UpdateLastActiveInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req.user?.userId) {
      this.userService.updateLastActiveTime(req.user.userId).catch(console.error);
    }
    return next.handle();
  }
}
