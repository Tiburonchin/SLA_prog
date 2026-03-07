import { IsString, IsNotEmpty, IsUUID, MaxLength, IsEnum } from 'class-validator';

/**
 * Tipos de incidente reconocidos por la Ley 29783 y su reglamento DS 005-2012-TR.
 * El Art. 82 obliga al reporte inmediato de accidentes mortales y graves,
 * y el sistema extiende esto a todos los eventos para trazabilidad preventiva.
 */
export enum TipoIncidente {
  ACCIDENTE_LEVE = 'ACCIDENTE_LEVE',
  ACCIDENTE_INCAPACITANTE = 'ACCIDENTE_INCAPACITANTE',
  ACCIDENTE_MORTAL = 'ACCIDENTE_MORTAL',
  INCIDENTE_PELIGROSO = 'INCIDENTE_PELIGROSO',
  CASI_ACCIDENTE = 'CASI_ACCIDENTE',
  CONDICION_INSEGURA = 'CONDICION_INSEGURA',
  ACTO_INSEGURO = 'ACTO_INSEGURO',
}

/**
 * DTO para el reporte rápido de incidentes en campo.
 *
 * Diseñado para ser completado en segundos desde dispositivos móviles,
 * cumpliendo con el mandato de reporte inmediato del Art. 82 Ley 29783.
 * Solo 3 campos obligatorios — el backend calcula el resto (fecha, auditoría).
 */
export class IncidenteRapidoDto {
  /**
   * Clasificación del evento según Ley 29783 Arts. 20-21.
   */
  @IsEnum(TipoIncidente, {
    message: `tipo debe ser uno de: ${Object.values(TipoIncidente).join(', ')}`,
  })
  @IsNotEmpty()
  tipo: TipoIncidente;

  /**
   * UUID del trabajador involucrado (víctima o primero en detectar el peligro).
   */
  @IsUUID(4, { message: 'trabajadorId debe ser un UUID v4 válido' })
  @IsNotEmpty()
  trabajadorId: string;

  /**
   * Descripción concisa del evento. Máx. 500 caracteres para facilitar
   * el ingreso en campo. Una investigación detallada se registra después.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, {
    message: 'descripcionBreve no puede superar 500 caracteres',
  })
  descripcionBreve: string;
}
