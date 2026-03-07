import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { TrabajadoresModule } from './modules/trabajadores/trabajadores.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { EquiposModule } from './modules/equipos/equipos.module';
import { SupervisoresModule } from './modules/supervisores/supervisores.module';
import { MatrizIpcModule } from './modules/matriz-ipc/matriz-ipc.module';
import { AmonestacionesModule } from './modules/amonestaciones/amonestaciones.module';
import { InspeccionesModule } from './modules/inspecciones/inspecciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { SyncModule } from './modules/sync/sync.module';
import { WeatherModule } from './modules/weather/weather.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IncidentesModule } from './modules/incidentes/incidentes.module';
import { MantenimientosModule } from './modules/mantenimientos/mantenimientos.module';

@Module({
  imports: [
    // Variables de entorno globales
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Tareas Cron
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120, // Increased to allow SPA burst requests without triggering HTTP 429
    }]),

    // Base de datos
    PrismaModule,

    // Módulos del sistema
    AuthModule,
    UsuariosModule,
    TrabajadoresModule,
    SucursalesModule,
    EquiposModule,
    SupervisoresModule,
    MatrizIpcModule,
    AmonestacionesModule,
    InspeccionesModule,
    ReportesModule,
    NotificacionesModule,
    SyncModule,
    WeatherModule,
    DashboardModule,
    IncidentesModule,
    MantenimientosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
