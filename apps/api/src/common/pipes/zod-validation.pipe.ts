import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema?: ZodSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schema) {
      return value;
    }
    const parseResult = this.schema.safeParse(value);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    return parseResult.data;
  }
}
