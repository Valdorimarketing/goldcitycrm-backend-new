import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'valdori-crm-super-secret-key-2024',
    });
  }

  async validate(payload: any) {
    // JWT payload'dan user bilgilerini döndür
    // Bu bilgiler request.user'a atanacak
    return {
      id: payload.sub, // subject (user id)
      email: payload.email,
      name: payload.name,
    };
  }
}
