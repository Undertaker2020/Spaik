import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

export function Authorization() {
    return applyDecorators(UseGuards(JwtAuthGuard));
}
