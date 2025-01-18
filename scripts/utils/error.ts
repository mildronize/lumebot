import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return fromZodError(error).message;
  } else if (error instanceof Error) {
    return error.message + ' Trace: ' + error.stack;
  } else {
    return 'Unknown error' + error;
  }
}
