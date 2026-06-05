import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountResolver } from './account.resolver';
import { UserReferenceResolver } from './user-reference.resolver';
import {VerificationService} from "@/src/modules/auth/verification/verification.service";

@Module({
  providers: [AccountResolver, AccountService, UserReferenceResolver, VerificationService],
})
export class AccountModule {}
