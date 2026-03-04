import { Module } from '@nestjs/common';
import { MatrizIpcController } from './matriz-ipc.controller';
import { MatrizIpcService } from './matriz-ipc.service';

@Module({
  controllers: [MatrizIpcController],
  providers: [MatrizIpcService],
  exports: [MatrizIpcService],
})
export class MatrizIpcModule {}
