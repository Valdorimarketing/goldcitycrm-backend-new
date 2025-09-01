import { SetMetadata } from '@nestjs/common';

// Bu decorator ile işaretlenen endpoint'ler JWT kontrolünden muaf olur
export const Public = () => SetMetadata('isPublic', true);