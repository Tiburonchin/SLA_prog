import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('sync')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  async syncOfflineData(@Req() req: any, @Body() payload: any) {
    return this.syncService.syncData(req.user, payload);
  }
}
